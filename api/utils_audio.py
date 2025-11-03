import numpy as np
import librosa
import scipy.signal as ss


def load_audio_mono(path, target_sr=None):
    """
    Load any .wav as mono float32.
    Optionally resample to target_sr.
    Returns (y, sr).
    """
    y, sr = librosa.load(path, sr=None, mono=True)

    # optional resample
    if target_sr is not None and sr != target_sr:
        y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
        sr = target_sr

    # light peak normalization so we don't clip downstream
    peak = np.max(np.abs(y)) if y.size else 0.0
    if peak > 0:
        y = 0.99 * (y / peak)

    return y.astype(np.float32), int(sr)


def stft_mask_denoise(y, sr):
    """
    Your spectral gate / STFT noise suppressor.

    Steps:
    - STFT
    - Estimate noise profile from first ~0.1 sec
    - Binary mask + median filter smoothing
    - iSTFT

    Returns (y_clean, sr)
    """
    if y.size == 0:
        return y.astype(np.float32), sr

    S_full, phase = librosa.magphase(librosa.stft(y))
    # estimate stationary noise from first 0.1s
    noise_power = np.mean(S_full[:, : int(sr * 0.1)], axis=1)
    # build a mask where signal > noise
    mask = S_full > noise_power[:, None]
    # smooth mask in time
    mask = ss.medfilt(mask.astype(float), kernel_size=(1, 5))

    S_clean = mask * S_full
    y_clean = librosa.istft(S_clean * phase)

    # normalize
    peak = np.max(np.abs(y_clean)) if y_clean.size else 0.0
    if peak > 0:
        y_clean = 0.99 * (y_clean / peak)

    return y_clean.astype(np.float32), sr


def extract_band_features(
    y,
    sr,
    n_fft=4096,
    hop_length=512,
    floor_db_drop=30.0,
    min_freq_hz=5.0,
):
    """
    Basic acoustic descriptors for a clip:
    - duration
    - RMS mean (loudness proxy)
    - spectral centroid mean
    - estimated main band [low_freq_hz, high_freq_hz] where the call lives
      (we keep bins within floor_db_drop dB of the spectral peak)
    - bandwidth (high-low)

    Returns dict with:
      low_freq_hz, high_freq_hz, bandwidth_hz,
      centroid_mean_hz, rms_mean, duration_sec
    """
    if y.size == 0:
        return {
            "low_freq_hz": 0.0,
            "high_freq_hz": 0.0,
            "bandwidth_hz": 0.0,
            "centroid_mean_hz": 0.0,
            "rms_mean": 0.0,
            "duration_sec": 0.0,
        }

    duration_sec = len(y) / sr

    # RMS energy over frames
    rms_vec = librosa.feature.rms(
        y=y,
        frame_length=2048,
        hop_length=hop_length,
    )[0]
    rms_mean = float(np.mean(rms_vec)) if rms_vec.size else 0.0

    # spectral centroid (brightness)
    centroid_vec = librosa.feature.spectral_centroid(
        y=y,
        sr=sr,
        n_fft=n_fft,
        hop_length=hop_length,
    )[0]
    centroid_mean_hz = float(np.mean(centroid_vec)) if centroid_vec.size else 0.0

    # average magnitude spectrum
    S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length, center=True))
    spec_mean = np.mean(S, axis=1)  # [freq_bins]
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)

    # ignore < min_freq_hz
    valid_mask = freqs >= min_freq_hz
    freqs_valid = freqs[valid_mask]
    spec_valid = spec_mean[valid_mask]

    if spec_valid.size == 0:
        low_freq_hz = 0.0
        high_freq_hz = 0.0
    else:
        spec_db = 20.0 * np.log10(spec_valid + 1e-12)
        peak_db = float(np.max(spec_db))
        strong_mask = spec_db >= (peak_db - floor_db_drop)

        if np.any(strong_mask):
            band_freqs = freqs_valid[strong_mask]
            low_freq_hz = float(np.min(band_freqs))
            high_freq_hz = float(np.max(band_freqs))
        else:
            # fallback: just pick the single best bin
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


def estimate_noise_floor_db(y, sr, frame_length=2048, hop_length=512):
    """
    Estimate background noise by:
    - computing frame RMS
    - taking quietest 20% frames
    - converting to dB
    """
    if y.size == 0:
        return 0.0

    rms = librosa.feature.rms(
        y=y,
        frame_length=frame_length,
        hop_length=hop_length,
    )[0]

    if rms.size == 0:
        return 0.0

    k = max(1, int(0.2 * len(rms)))
    quiet = np.sort(rms)[:k]
    quiet_db = 20.0 * np.log10(quiet + 1e-12)
    return float(np.mean(quiet_db))


def compute_spectrogram_preview(
    y,
    sr,
    n_fft=1024,
    hop_length=256,
    max_freq_hz=8000.0,
    db_floor=-80.0,
    time_bins_target=256,
    freq_bins_target=128,
):
    """
    Build a lightweight spectrogram snapshot that frontend can plot.

    Steps:
    - STFT magnitude
    - convert to dB
    - clip to <= max_freq_hz
    - downsample to (freq_bins_target x time_bins_target)

    Returns:
    {
      "db":    2D list [freq_bins x time_bins] in dB (float),
      "freqs": 1D list of freqs in Hz,
      "times": 1D list of times in seconds
    }
    """
    if y is None or y.size == 0:
        return {
            "db": [],
            "freqs": [],
            "times": [],
        }

    # magnitude spectrogram
    S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)  # [F]
    times = librosa.frames_to_time(
        np.arange(S.shape[1]),
        sr=sr,
        hop_length=hop_length,
    )  # [T]

    # keep only up to max_freq_hz
    mask = freqs <= max_freq_hz
    S = S[mask, :]
    freqs = freqs[mask]

    # power -> dB
    S_db = librosa.amplitude_to_db(S, ref=np.max)
    # clamp floor for nicer dynamic range
    S_db = np.maximum(S_db, db_floor)

    F, T = S_db.shape

    # choose evenly spaced freq bins
    if F > freq_bins_target:
        f_idx = np.linspace(0, F - 1, freq_bins_target).astype(int)
    else:
        f_idx = np.arange(F)

    # choose evenly spaced time bins
    if T > time_bins_target:
        t_idx = np.linspace(0, T - 1, time_bins_target).astype(int)
    else:
        t_idx = np.arange(T)

    S_small = S_db[np.ix_(f_idx, t_idx)]
    freqs_small = freqs[f_idx]
    times_small = times[t_idx]

    return {
        "db": S_small.astype(float).tolist(),
        "freqs": freqs_small.astype(float).tolist(),
        "times": times_small.astype(float).tolist(),
    }
