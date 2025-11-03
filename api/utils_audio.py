# denoising_pipeline/api/utils_audio.py

import numpy as np
import librosa

def load_audio_mono(path, target_sr=None):
    """
    Load audio file as mono float32.
    If target_sr is provided, resample to that sr.
    Returns y, sr.
    """
    y, sr = librosa.load(path, sr=None, mono=True)
    if target_sr is not None and sr != target_sr:
        y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
        sr = target_sr
    # light normalize to avoid crazy peaks
    peak = np.max(np.abs(y)) if y.size else 0
    if peak > 0:
        y = 0.99 * y / peak
    return y.astype(np.float32), int(sr)

def extract_band_features(
    y,
    sr,
    n_fft=4096,
    hop_length=512,
    floor_db_drop=30.0,
    min_freq_hz=5.0
):
    """
    Same as before: estimate main energy band of call.
    """
    if len(y) == 0:
        return {
            "low_freq_hz": 0.0,
            "high_freq_hz": 0.0,
            "bandwidth_hz": 0.0,
            "centroid_mean_hz": 0.0,
            "rms_mean": 0.0,
            "duration_sec": 0.0,
        }

    duration_sec = len(y) / sr

    # RMS ~ loudness
    rms_vec = librosa.feature.rms(y=y, frame_length=2048, hop_length=hop_length)[0]
    rms_mean = float(np.mean(rms_vec)) if rms_vec.size else 0.0

    # spectral centroid ~ brightness
    centroid_vec = librosa.feature.spectral_centroid(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length
    )[0]
    centroid_mean_hz = float(np.mean(centroid_vec)) if centroid_vec.size else 0.0

    # average spectrum over time
    S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length, center=True))
    spec_mean = np.mean(S, axis=1)  # [freq_bins]
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)

    # ignore crazy-low rumble
    valid_mask = freqs >= min_freq_hz
    freqs_valid = freqs[valid_mask]
    spec_valid = spec_mean[valid_mask]

    if spec_valid.size == 0:
        low_freq_hz = 0.0
        high_freq_hz = 0.0
    else:
        spec_db = 20 * np.log10(spec_valid + 1e-12)
        peak_db = np.max(spec_db)
        strong_mask = spec_db >= (peak_db - floor_db_drop)

        if np.any(strong_mask):
            strong_freqs = freqs_valid[strong_mask]
            low_freq_hz = float(np.min(strong_freqs))
            high_freq_hz = float(np.max(strong_freqs))
        else:
            # fallback: single loudest bin
            idx = int(np.argmax(spec_db))
            low_freq_hz = float(freqs_valid[idx])
            high_freq_hz = float(freqs_valid[idx])

    bandwidth_hz = float(high_freq_hz - low_freq_hz)

    return {
        "low_freq_hz": low_freq_hz,
        "high_freq_hz": high_freq_hz,
        "bandwidth_hz": bandwidth_hz,
        "centroid_mean_hz": centroid_mean_hz,
        "rms_mean": rms_mean,
        "duration_sec": duration_sec,
    }
