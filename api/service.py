# denoising_pipeline/api/service.py

import os
import torch
import numpy as np
import soundfile as sf
from .utils_audio import load_audio_mono, extract_band_features

def _ensure_dir(path):
    d = os.path.dirname(path)
    if d and not os.path.exists(d):
        os.makedirs(d, exist_ok=True)

def denoise_openunmix_like(
    in_path: str,
    out_path: str,
    device: str = "cpu"
):
    """
    Approximate Open-Unmix style foreground isolation.
    - loads mono
    - resamples to 44.1kHz (what UMX expects)
    - fakes stereo
    - runs UMX to get 'vocals' foreground stem
    - saves cleaned mono wav to out_path
    returns (y_clean, sr)
    """

    # load + prep signal
    y, sr = load_audio_mono(in_path, target_sr=44100)

    # fake stereo [2, T] -> torch [1, 2, T]
    y_stereo = np.stack([y, y], axis=0).astype(np.float32)
    mix_tensor = torch.tensor(y_stereo, dtype=torch.float32, device=device).unsqueeze(0)

    # load model
    targets = ["vocals", "other"]
    umx = torch.hub.load(
        "sigsep/open-unmix-pytorch",
        "umx",
        targets=targets,
        device=device,
        pretrained=True
    )
    umx.eval()

    with torch.no_grad():
        estimates = umx(mix_tensor)

    # handle dict or tensor
    if isinstance(estimates, dict):
        if "vocals" in estimates:
            est = estimates["vocals"].cpu().numpy()
        else:
            # fallback: take first key
            k0 = list(estimates.keys())[0]
            est = estimates[k0].cpu().numpy()
    else:
        est = estimates.cpu().numpy()

    # est could be [B, C, T], [B, N, C, T], [C, T], etc.
    a = np.array(est)
    if a.ndim == 4:  # [B, N, C, T] -> take [0,0]
        a = a[0, 0]
    elif a.ndim == 3:  # [B, C, T] -> take [0]
        a = a[0]
    # now expect [C, T] or [T]
    if a.ndim == 2:
        a = a.mean(axis=0)  # downmix stereo -> mono
    a = np.squeeze(a).astype(np.float32)

    # normalize output
    peak = float(np.max(np.abs(a))) if a.size else 0.0
    if peak > 0:
        a = 0.99 * (a / peak)

    # write file
    _ensure_dir(out_path)
    sf.write(out_path, a, int(sr))

    return a, int(sr)

def analyze_audio_file(in_path: str, work_dir: str = "tmp_api", device: str = "cpu"):
    """
    High-level:
    1. Denoise using Open-Unmix-like approach.
    2. Extract acoustic features from cleaned audio.
    3. Return dict with features + paths.
    """

    _ensure_dir(work_dir)
    cleaned_path = os.path.join(work_dir, "cleaned.wav")

    y_clean, sr_clean = denoise_openunmix_like(
        in_path=in_path,
        out_path=cleaned_path,
        device=device
    )

    feats = extract_band_features(y_clean, sr_clean)

    response = {
        "sample_rate": sr_clean,
        "cleaned_file": cleaned_path,
        **feats
    }
    return response
