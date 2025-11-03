# denoising_pipeline/api/models.py

from pydantic import BaseModel

class AnalysisResponse(BaseModel):
    sample_rate: int
    cleaned_file: str
    duration_sec: float
    rms_mean: float
    centroid_mean_hz: float
    low_freq_hz: float
    high_freq_hz: float
    bandwidth_hz: float
