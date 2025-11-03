# 🐋 Whale-sentiment-analysis

*A Hybrid Denoising and Sentiment Study*  
Dedicated to Sea Giants and Gojira fans alike!  
This project introduces a cutting-edge hybrid denoising technique to extract whale calls from underwater recordings and applies sentiment analysis to classify their expressiveness and mood.

---

## 📘 Overview


<img width="1723" height="957" alt="whaleAnalyzerCall" src="https://github.com/user-attachments/assets/5e6d7d1c-3ea7-4c01-bcaa-d177f3bd67f3" />

This repository provides a **complete pipeline** for:

- Denoising whale vocalizations
- Evaluating and comparing multiple denoising techniques
- Selecting the best preprocessing method for **automated call classification**
- The project is devided into 3 main folders :
1. state-of-the-art : Highly recomended to start with the notebook to understand the concepts (signal.ipynb, for more curiousity about the whale panic study : panic.ipynb)
2. API : backend using fast api
3. Frontend-Whale : frontend of the app, maritime theme

### 🐳 Workflow Comparison

We compare the following methods:

1. **Original audio**
2. **STFT mask denoising** (Fourier-based noise suppression)
3. **Demucs** (deep-learning music source separation)
4. **Open-Unmix (UMX)** (deep-learning harmonic/background separator)

For each technique, we visualize:

- Waveforms
- Spectrograms (log-frequency)
- **Quantitative acoustic features:**  
  bandwidth, noise floor, RMS, & more

---

## ⚙️ Setup Instructions

### 1️⃣ Environment Setup

1. **Create a virtual environment:**
   ```
   python -m venv .venv
   ```

2. **Activate your environment:**  
   - **Linux/Mac:**  
     ```
     source .venv/bin/activate
     ```
   - **Windows:**  
     ```
     .venv\Scripts\activate
     ```

3. **Upgrade pip & install dependencies:**
   ```
   pip install -U pip
   pip install numpy pandas librosa soundfile matplotlib scipy seaborn torch demucs openunmix
   ```

---

### 🧩 Notes

- **Demucs and Open-Unmix require PyTorch**  
  - CPU is okay, but GPU will speed up processing.

- **FFmpeg** is *not required* if using Librosa to load audio.

---

## 🔊 Denoising Models & Architectures

This project evaluates several denoising methods. Below is a brief overview of each and their core architectural components.

### 1. STFT Mask Denoising (Spectral Subtraction)

- **Method:** Uses the Short-Time Fourier Transform (STFT) to convert audio to the frequency domain.
- **Architecture:**  
  - Noise estimation and creation of a spectral mask.
  - Mask applied to the magnitude spectrum to suppress noise components.
  - Inverse STFT reconstructs the denoised audio.
- **Use Cases:** Classical method for speech and bioacoustic enhancement; fast and interpretable.

### 2. Demucs (Deep Extractor for MUsic Sources)

- **Method:** Deep-learning model for source separation, initially designed for music but applicable to whale audio.
- **Architecture:**  
  - **Encoder-Decoder U-Net structure** with convolutional layers.
  - **Bidirectional LSTM layers** capture temporal dependencies.
  - Input audio is split into frames, processed via convolutional blocks, downsampled, then upsampled in symmetric fashion, with skip-connections.
  - Final output reconstructs sources (foreground, background, noise).


### 3. Open-Unmix (UMX)

- **Method:** Deep learning for separating vocals and accompaniment, adaptable for whale calls vs. ambient noise.
- **Architecture:**  
  - **Three-stage neural network:**  
    - Input spectrogram processed via fully-connected layers (dense).
    - **Bidirectional LSTM** for sequence modeling of spectral frames.
    - Output masking to isolate target components from the mixture.
  - Can handle multi-channel (stereo) data.


---

## 📝 Essential Research Papers
_
A shortlist of foundational literature for whale acoustics, signal denoising, and sentiment analysis in bioacoustics:
1. Sentiment and Acoustic Feature Analysis

Human cerebral response to animal affective vocalizations : 
https://pmc.ncbi.nlm.nih.gov/articles/PMC2596811/

A review on speech emotion recognition: A survey, recent advances, challenges, and the influence of noise :
https://www.sciencedirect.com/science/article/abs/pii/S0925231223011384

2. Signal Denoising & Source Separation :

Hybrid Demucs: Efficient deep learning architecture for music source separation.
https://docs.pytorch.org/audio/stable/tutorials/hybrid_demucs_tutorial.html

Open-Unmix: A reference implementation for music source separation.
https://joss.theoj.org/papers/10.21105/joss.01667.pdf

Suppression of acoustic noise in speech using spectral subtraction.
https://ieeexplore.ieee.org/document/1163209

3.Whale Vocalization & Bioacoustics

The Sonar of Dolphins.
https://royalsocietypublishing.org/doi/10.1098/rsos.240650

Songs of humpback whales.
https://www.science.org/doi/10.1126/science.173.3997.585

Mellinger, D.K., et al. (2007).
https://tos.org/oceanography/article/an-overview-of-fixed-passive-acoustic-observation-methods-for-cetaceans


---

*Feel free to open issues or propose additions if you know other relevant papers!*
