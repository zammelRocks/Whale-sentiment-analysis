 🐋 Whale-sentiment-analysis

*A Hybrid Denoising and Sentiment Study*  
Dedicated to Sea Giants and Gojira fans alike!  
This project introduces a cutting-edge hybrid denoising technique to extract whale calls from underwater recordings and applies sentiment analysis to classify their expressiveness and mood.

---

## 🚀 Tech Stack

- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Frontend:** [React](https://react.dev/)
- **Data Science/Audio Processing:** NumPy, Pandas, Librosa, PyTorch, Demucs, Open-Unmix

---

## 📘 Overview

This repository provides a **complete pipeline** for:

- Denoising whale vocalizations
- Comparing denoising techniques
- Automated call classification and sentiment/emotion analysis

---

## 🛠️ Setup Instructions

### Backend (FastAPI)

1. **Create and activate a Python environment:**
    ```
    python -m venv .venv
    source .venv/bin/activate      # or .venv\Scripts\activate on Windows
    ```
2. **Install backend dependencies:**
    ```
    pip install -U pip
    pip install fastapi uvicorn numpy pandas librosa soundfile matplotlib scipy seaborn torch demucs openunmix
    ```
3. **Run the FastAPI server:**
    ```
    uvicorn app.main:app --reload
    ```
    *(Assuming your FastAPI entry point is at `app/main.py`)*

### Frontend (React)

1. **Navigate to the frontend directory:**
    ```
    cd frontend
    ```
2. **Install frontend dependencies:**
    ```
    npm install
    ```
3. **Start the React development server:**
    ```
    npm start
    ```
    *(The frontend will typically default to [http://localhost:3000](http://localhost:3000))*

---

## 📂 EMOTIONPROCESSING Project

The repo now includes the `EMOTIONPROCESSING` subproject for emotion/sentiment analysis in whale audio.

**Folders:**
- `humpbacks-orcasound-em-hW-data/`: Humpback whale dataset
- `ReferenceAudio/`: Reference audio samples
- `ReferenceWav/`: Reference .wav files

---

## 🔊 Denoising Models & Architectures

### STFT Mask Denoising (Spectral Subtraction)
**Classical spectral processing:** noise suppression using STFT domain masks.

### Demucs
**Deep-learning music source separation:** Uses a U-Net encoder-decoder with convolutional and bi-directional LSTM layers.

### Open-Unmix (UMX)
**Deep-learning harmonic/background separator:** Fully connected layers + bi-directional LSTM for spectrogram sequence modeling.

---

## 📝 Essential Research Papers

- **Au, W.W.L. (1993). The Sonar of Dolphins.** [Springer Handbook](https://link.springer.com/book/10.1007/978-1-4757-2443-0)
- **Payne & McVay (1971). Songs of humpback whales.** [Science](https://www.science.org/doi/10.1126/science.173.3992.585)
- **Défossez et al. (2021). Hybrid Demucs.** [arXiv](https://arxiv.org/abs/2201.04600)
- **Stöter et al. (2019). Open-Unmix.** [JOSS](https://joss.theoj.org/papers/10.21105/joss.01667)
- and others (full list above)...

---

*Feel free to open issues or suggest improvements!*
