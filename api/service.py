import os
import numpy as np
import soundfile as sf
import torch

from api.utils_audio import (
    load_audio_mono,
    stft_mask_denoise,
    extract_band_features,
    estimate_noise_floor_db,
    compute_spectrogram_preview,
)

# -----------------
# helpers
# -----------------

def _ensure_dir_for_file(path: str):
    """
    Make sure the directory for 'path' exists.
    """
    d = os.path.dirname(os.path.abspath(path))
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)


def _normalize(y: np.ndarray) -> np.ndarray:
    """
    Peak-normalize to [-1,1] scale-ish so we don't clip later.
    """
    if y.size == 0:
        return y.astype(np.float32)
    peak = np.max(np.abs(y))
    if peak > 0:
        y = 0.99 * (y / peak)
    return y.astype(np.float32)


def _summarize_clip(y, sr):
    """
    Compute scalar audio descriptors.
    """
    feats = extract_band_features(y, sr)
    noise_db = estimate_noise_floor_db(y, sr)
    return {
        "sample_rate": sr,
        "duration_sec": feats["duration_sec"],
        "rms_mean": feats["rms_mean"],
        "centroid_mean_hz": feats["centroid_mean_hz"],
        "low_freq_hz": feats["low_freq_hz"],
        "high_freq_hz": feats["high_freq_hz"],
        "bandwidth_hz": feats["bandwidth_hz"],
        "noise_floor_dB": noise_db,
    }


def _attach_spectrogram(stats_dict, y, sr):
    """
    Add the compact spectrogram preview.
    """
    stats_dict["spectrogram"] = compute_spectrogram_preview(y, sr)
    return stats_dict


# -----------------
# model refinement steps (Demucs / UMX)
# -----------------

def _apply_demucs_to_signal(y_in: np.ndarray, sr_in: int, device="cpu"):
    """
    Apply Demucs as a refinement layer on an already-denoised mono signal.
    Returns (foreground_estimate_mono, same_sr)
    """
    from demucs.pretrained import get_model
    from demucs.apply import apply_model

    # Demucs expects stereo [B, 2, T]
    stereo = np.stack([y_in, y_in], axis=0).astype(np.float32)  # [2, T]
    mix_tensor = (
        torch.tensor(stereo, dtype=torch.float32, device=device)
        .unsqueeze(0)  # [1,2,T]
    )

    model = get_model("htdemucs")
    model.to(device)
    model.eval()

    with torch.no_grad():
        est = apply_model(model, mix_tensor, device=device)  # [B, stems, C, T]

    est_np = est.squeeze(0).cpu().numpy()  # [stems, C, T]
    # heuristic: last stem ~ 'vocals' (foreground)
    chosen = est_np[-1]  # [C, T] or [T]

    if chosen.ndim == 2:  # [C, T] stereo
        y_clean = chosen.mean(axis=0)
    else:
        y_clean = chosen

    y_clean = np.squeeze(y_clean)
    y_clean = _normalize(y_clean)
    return y_clean, sr_in


def _apply_umx_to_signal(y_in: np.ndarray, sr_in: int, device="cpu"):
    """
    Apply Open-Unmix (UMX) as a refinement layer on an already-denoised mono signal.

    UMX is trained at 44.1kHz stereo, so we:
    - resample to 44.1kHz if needed
    - duplicate mono to stereo
    - run UMX
    - grab 'vocals' stem
    - downmix back to mono
    - normalize
    """
    import librosa

    target_sr = 44100
    if sr_in != target_sr:
        y_resamp = librosa.resample(y_in, orig_sr=sr_in, target_sr=target_sr)
        sr_proc = target_sr
    else:
        y_resamp = y_in
        sr_proc = sr_in

    stereo = np.stack([y_resamp, y_resamp], axis=0).astype(np.float32)  # [2, T]
    mix_tensor = (
        torch.tensor(stereo, dtype=torch.float32, device=device)
        .unsqueeze(0)  # [1,2,T]
    )

    targets = ["vocals", "other"]
    umx = torch.hub.load(
        "sigsep/open-unmix-pytorch",
        "umx",
        targets=targets,
        device=device,
        pretrained=True,
    )
    umx.eval()

    with torch.no_grad():
        estimates = umx(mix_tensor)

    # handle dict or tensor return
    if isinstance(estimates, dict):
        if "vocals" in estimates:
            est = estimates["vocals"].cpu().numpy()
        else:
            # fallback to first key if "vocals" missing
            first_key = list(estimates.keys())[0]
            est = estimates[first_key].cpu().numpy()
    else:
        est = estimates.cpu().numpy()

    a = np.array(est)

    # shapes:
    #  - [B, N, C, T] (rare but some variants): take [0,0]
    #  - [B, C, T]: take [0]
    #  - [C, T]: use directly
    if a.ndim == 4:
        a = a[0, 0]   # [C, T]
    elif a.ndim == 3:
        a = a[0]      # [C, T]

    if a.ndim == 2:
        a = a.mean(axis=0)  # stereo -> mono

    y_clean = np.squeeze(a)
    y_clean = _normalize(y_clean)

    return y_clean, sr_proc


# -----------------
# MASTER PIPELINE
# -----------------

def analyze_pipeline(
    in_path: str,
    work_dir: str,
    base_url: str,
    device: str = "cpu",
):
    """
    1. Load original
    2. Denoise with STFT mask  (baseline cleaned signal)
    3. Refine that with Demucs
    4. Refine that with UMX

    For each stage:
      - write wav to work_dir
      - compute summary stats
      - compute spectrogram preview
      - include audio_url so frontend can <audio src=... />
    """

    # ensure output directory exists
    abs_work_dir = os.path.abspath(work_dir)
    os.makedirs(abs_work_dir, exist_ok=True)

    # -----------------
    # ORIGINAL
    # -----------------
    y_orig, sr_orig = load_audio_mono(in_path, target_sr=None)
    y_orig = _normalize(y_orig)

    orig_path = os.path.join(abs_work_dir, "original.wav")
    _ensure_dir_for_file(orig_path)
    sf.write(orig_path, y_orig, sr_orig)

    stats_orig = _summarize_clip(y_orig, sr_orig)
    stats_orig["audio_url"] = f"{base_url}/audio/original.wav"
    stats_orig = _attach_spectrogram(stats_orig, y_orig, sr_orig)

    # -----------------
    # STFT CLEAN
    # -----------------
    y_stft, sr_stft = stft_mask_denoise(y_orig, sr_orig)

    stft_path = os.path.join(abs_work_dir, "stft.wav")
    _ensure_dir_for_file(stft_path)
    sf.write(stft_path, y_stft, sr_stft)

    stats_stft = _summarize_clip(y_stft, sr_stft)
    stats_stft["audio_url"] = f"{base_url}/audio/stft.wav"
    stats_stft = _attach_spectrogram(stats_stft, y_stft, sr_stft)

    # -----------------
    # STFT -> DEMUCS
    # -----------------
    y_stft_demucs, sr_stft_demucs = _apply_demucs_to_signal(
        y_stft, sr_stft, device=device
    )

    stft_demucs_path = os.path.join(abs_work_dir, "stft_demucs.wav")
    _ensure_dir_for_file(stft_demucs_path)
    sf.write(stft_demucs_path, y_stft_demucs, sr_stft_demucs)

    stats_stft_demucs = _summarize_clip(y_stft_demucs, sr_stft_demucs)
    stats_stft_demucs["audio_url"] = f"{base_url}/audio/stft_demucs.wav"
    stats_stft_demucs = _attach_spectrogram(
        stats_stft_demucs, y_stft_demucs, sr_stft_demucs
    )

    # -----------------
    # STFT -> UMX
    # -----------------
    y_stft_umx, sr_stft_umx = _apply_umx_to_signal(
        y_stft, sr_stft, device=device
    )

    stft_umx_path = os.path.join(abs_work_dir, "stft_umx.wav")
    _ensure_dir_for_file(stft_umx_path)
    sf.write(stft_umx_path, y_stft_umx, sr_stft_umx)

    stats_stft_umx = _summarize_clip(y_stft_umx, sr_stft_umx)
    stats_stft_umx["audio_url"] = f"{base_url}/audio/stft_umx.wav"
    stats_stft_umx = _attach_spectrogram(
        stats_stft_umx, y_stft_umx, sr_stft_umx
    )

    # -----------------
    # return the payload
    # -----------------
    return {
        "original": stats_orig,
        "stft": stats_stft,
        "stft_demucs": stats_stft_demucs,
        "stft_umx": stats_stft_umx,
    }
