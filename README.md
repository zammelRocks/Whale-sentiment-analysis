# 🐋 Whale-sentiment-analysis

*A Hybrid Denoising and Sentiment Study*  
Dedicated to Sea Giants and Gojira fans alike!  
This project introduces a cutting-edge hybrid denoising technique to extract whale calls from underwater recordings and applies sentiment analysis to classify their expressiveness and mood.

---

## 📘 Overview

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
- **References:**  
  [Défossez et al., 2021 - Hybrid Demucs](https://arxiv.org/abs/2201.04600)

### 3. Open-Unmix (UMX)

- **Method:** Deep learning for separating vocals and accompaniment, adaptable for whale calls vs. ambient noise.
- **Architecture:**  
  - **Three-stage neural network:**  
    - Input spectrogram processed via fully-connected layers (dense).
    - **Bidirectional LSTM** for sequence modeling of spectral frames.
    - Output masking to isolate target components from the mixture.
  - Can handle multi-channel (stereo) data.
- **References:**  
  [Stöter et al., 2019 - Open-Unmix](https://joss.theoj.org/papers/10.21105/joss.01667)

---

## 📝 Essential Research Papers

A shortlist of foundational literature for whale acoustics, signal denoising, and sentiment analysis in bioacoustics:

### Whale Vocalization & Bioacoustics

- **Au, W.W.L. (1993).**  
  _The Sonar of Dolphins._  
  [Springer Handbook link](https://link.springer.com/book/10.1007/978-1-4757-2443-0)  
  *Seminal reference for underwater acoustics and cetacean signal analysis.*

- **Payne, R.S., & McVay, S. (1971).**  
  _Songs of humpback whales._  
  [Science, 173(3992):585–597.](https://www.science.org/doi/10.1126/science.173.3992.585)  
  *Groundbreaking analysis of whale song structure.*

- **Mellinger, D.K., et al. (2007).**  
  _An overview of fixed passive acoustic observation methods for cetaceans._  
  [Oceanography, 20(4):36–45.](https://www.jstor.org/stable/24860812)  
  *Overview of acoustic monitoring techniques for marine mammals.*

### Signal Denoising & Source Separation

- **Défossez, A., et al. (2021).**  
  _Hybrid Demucs: Efficient deep learning architecture for music source separation._  
  [arXiv:2201.04600](https://arxiv.org/abs/2201.04600)  
  *Demucs (DL-based denoising and separation) architecture details.*

- **Stöter, F.-R., et al. (2019).**  
  _Open-Unmix: A reference implementation for music source separation._  
  [Journal of Open Source Software, 4(41), 1667.](https://joss.theoj.org/papers/10.21105/joss.01667)  
  *Open-Unmix audio source separation (used in this repo).*

- **Boll, S.F. (1979).**  
  _Suppression of acoustic noise in speech using spectral subtraction._  
  [IEEE Transactions on Acoustics, Speech, and Signal Processing, 27(2), 113-120.](https://ieeexplore.ieee.org/document/1163209)  
  *Classical approach for noise reduction (foundation for modern spectral denoising).*

### Sentiment and Acoustic Feature Analysis

- **Cowen, A. S., et al. (2020).**  
  _Four areas of the brain underlie the perception of emotion in animal vocalizations._  
  [PNAS, 117(8), 4382–4392.](https://www.pnas.org/doi/10.1073/pnas.1917004117)  
  *Emotion recognition from non-human animal sounds.*

- **Mota, J., et al. (2015).**  
  _Speech emotion recognition: A review._  
  [IEEE Transactions on Affective Computing, 6(4):373–387.](https://ieeexplore.ieee.org/document/6821387)  
  *General review of methods for sentiment/emotion analysis from acoustic features.*

---

*Feel free to open issues or propose additions if you know other relevant papers!*
