from pydantic import BaseModel
from typing import List


class SpectrogramPreview(BaseModel):
    db: List[List[float]]      # 2D: [freq_bins x time_bins] dB values
    freqs: List[float]         # Hz
    times: List[float]         # seconds


class MethodStats(BaseModel):
    sample_rate: int
    duration_sec: float
    rms_mean: float
    centroid_mean_hz: float
    low_freq_hz: float
    high_freq_hz: float
    bandwidth_hz: float
    noise_floor_dB: float
    audio_url: str
    spectrogram: SpectrogramPreview


class PipelineResponse(BaseModel):
    original: MethodStats
    stft: MethodStats
    stft_demucs: MethodStats
    stft_umx: MethodStats
