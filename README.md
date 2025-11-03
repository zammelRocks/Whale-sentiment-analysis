# Whale-sentiment-analysis
🐋 Whale Call Analysis — A Hybrid Denoising and Sentiment Study 
This project is dedicated to Sea Giants and Gojira fans alike. It introduces a hybrid denoising technique to extract whale calls from underwater recordings and applies sentiment analysis to classify the emotional or behavioral nature of these calls.  The goal is to better understand the frequency bandwidth and expressive characteristics of the giants’ communication.

📘 Overview

This repository provides a complete pipeline for denoising whale vocalizations and evaluating multiple denoising techniques to identify the best preprocessing method for automated call classification.

The workflow compares:

Original audio

STFT mask denoising (Fourier-based noise suppression)

Demucs (deep-learning music source separation)

Open-Unmix (UMX) (deep-learning harmonic/background separator)

For each method, we visualize:

Waveforms

Spectrograms (log-frequency)

Quantitative acoustic features (bandwidth, noise floor, RMS, etc.)

⚙️ Setup Instructions
1️⃣ Environment Setup
Install dependencies:
python -m venv .venv
source .venv/bin/activate      # On Windows: .venv\Scripts\activate
pip install -U pip
pip install numpy pandas librosa soundfile matplotlib scipy seaborn torch demucs openunmix


🧩 Note:

Demucs and Open-Unmix require PyTorch; CPU is fine but GPU will speed up processing.

FFmpeg is not required if using Librosa to load audio.
