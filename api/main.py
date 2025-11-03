import os
import uuid
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from api.service import analyze_pipeline
from api.models import PipelineResponse

# -----------------
# config
# -----------------

# This is the base URL that will prefix audio URLs returned to the frontend.
# If your backend runs somewhere else, update this.
API_BASE_URL = "http://127.0.0.1:8000"

# Where uploaded raw user files go
UPLOAD_DIR = "api/uploads"

# Where processed audio versions go (the ones we serve to frontend)
OUTPUT_AUDIO_DIR = "tmp"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_AUDIO_DIR, exist_ok=True)

# -----------------
# app
# -----------------

app = FastAPI(
    title="Whale Call Denoising & Analysis API",
    description=(
        "Upload whale audio, run STFT denoise, refine with Demucs and UMX, "
        "and compare audio, spectrograms, and acoustic features."
    ),
    version="0.5.0",
)

# Allow local React app to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # dev mode: wide open
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose processed wavs at /audio/*
# e.g. http://127.0.0.1:8000/audio/stft_umx.wav
app.mount("/audio", StaticFiles(directory=OUTPUT_AUDIO_DIR), name="audio")


# -----------------
# routes
# -----------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=PipelineResponse)
async def analyze(file: UploadFile = File(...)):
    # 1. validate input type
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".wav", ".wave"]:
        return JSONResponse(
            status_code=400,
            content={"error": "Please upload a .wav file"},
        )

    # 2. save upload to disk
    unique_name = f"{uuid.uuid4().hex}{ext}"
    input_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(input_path, "wb") as f:
        f.write(await file.read())

    # 3. run pipeline
    result = analyze_pipeline(
        in_path=input_path,
        work_dir=OUTPUT_AUDIO_DIR,
        base_url=API_BASE_URL,
        device="cpu",
    )

    # 4. return structured result for frontend
    return result
