# denoising_pipeline/api/main.py
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from api.service import analyze_audio_file
from api.models import AnalysisResponse

app = FastAPI(
    title="Whale Call Denoising & Analysis API",
    description="Upload whale audio, get cleaned features for classification.",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in dev we allow all, we'll tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "denoising_pipeline/api/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...)):
    # 1. save uploaded file to disk
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".wav", ".wave"]:
        return JSONResponse(
            status_code=400,
            content={"error": "Please upload a .wav file"}
        )

    unique_name = f"{uuid.uuid4().hex}{ext}"
    input_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(input_path, "wb") as f:
        f.write(await file.read())

    # 2. run analysis pipeline
    result = analyze_audio_file(
        in_path=input_path,
        work_dir="denoising_pipeline/api/tmp",
        device="cpu"   # keep CPU for now
    )

    # 3. return structured response
    return AnalysisResponse(**result)
