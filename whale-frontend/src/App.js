import React, { useState } from "react";
import SpectrogramCanvas from "./components/SpectrogramCanvas";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const methodOrder = ["original", "stft", "stft_demucs", "stft_umx"];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setAnalysis(null);
    setErr(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setErr("Please choose a .wav file first.");
      return;
    }
    setLoading(true);
    setErr(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || `Request failed with ${res.status}`);
      }

      const data = await res.json();
      console.log("analysis result:", data);
      setAnalysis(data);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  function safeGet(methodName, key) {
    if (!analysis || !analysis[methodName]) return undefined;
    return analysis[methodName][key];
  }

  const makeBarData = (metricLabel, metricKey) => {
    if (!analysis) return null;

    const values = methodOrder.map((m) => safeGet(m, metricKey));
    if (values.some((v) => v === undefined)) return null;

    return {
      labels: ["Original", "STFT", "STFT+Demucs", "STFT+UMX"],
      datasets: [
        {
          label: metricLabel,
          data: values,
          backgroundColor: 'rgba(34, 211, 238, 0.6)',
          borderColor: 'rgba(34, 211, 238, 1)',
          borderWidth: 2,
        },
      ],
    };
  };

  const rmsData = makeBarData("RMS Mean", "rms_mean");
  const noiseData = makeBarData("Noise Floor (dB)", "noise_floor_dB");
  const bwData = makeBarData("Bandwidth (Hz)", "bandwidth_hz");

  return (
    <>
      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes rise {
          0% { bottom: -50px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { bottom: 100vh; opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        body {
          background: linear-gradient(to bottom, #001a33 0%, #003d5c 30%, #005477 60%, #006d8f 100%);
          min-height: 100vh;
          color: #e0f2fe;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .ocean-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        
        .bubble {
          position: absolute;
          bottom: -50px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(34, 211, 238, 0.1));
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: rise 20s infinite ease-in;
        }
        
        .main-card {
          background-color: rgba(0, 26, 51, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(34, 211, 238, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(34, 211, 238, 0.2);
        }
        
        .whale-icon {
          font-size: 3rem;
          filter: drop-shadow(0 4px 8px rgba(34, 211, 238, 0.4));
          animation: float 6s ease-in-out infinite;
        }
        
        .gradient-title {
          background: linear-gradient(135deg, #7dd3fc 0%, #22d3ee 50%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }
        
        .ocean-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent);
        }
        
        .info-box {
          background-color: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.3);
        }
        
        .btn-ocean {
          background-color: #22d3ee;
          border: 2px solid #06b6d4;
          color: #001a33;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(34, 211, 238, 0.3);
          transition: all 0.3s ease;
        }
        
        .btn-ocean:hover:not(:disabled) {
          background-color: #06b6d4;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(34, 211, 238, 0.5);
        }
        
        .btn-ocean:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .form-control-ocean {
          background-color: rgba(15, 23, 42, 0.6);
          color: #e0f2fe;
          border: 2px solid rgba(34, 211, 238, 0.3);
        }
        
        .form-control-ocean:focus {
          background-color: rgba(15, 23, 42, 0.8);
          color: #e0f2fe;
          border-color: #22d3ee;
          box-shadow: 0 0 0 0.25rem rgba(34, 211, 238, 0.25);
        }
        
        .section-card {
          background-color: rgba(3, 105, 161, 0.15);
          border: 1px solid rgba(34, 211, 238, 0.3);
        }
        
        .method-card {
          background-color: rgba(0, 26, 51, 0.6);
          border: 1px solid rgba(34, 211, 238, 0.2);
        }
        
        .audio-card {
          background-color: rgba(0, 26, 51, 0.5);
          border: 1px solid rgba(34, 211, 238, 0.2);
        }
        
        .metric-row {
          border-bottom: 1px solid rgba(34, 211, 238, 0.1);
          font-family: 'SF Mono', Monaco, 'Courier New', monospace;
          font-size: 0.85rem;
        }
        
        .method-title {
          color: #22d3ee;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid rgba(34, 211, 238, 0.2);
        }
        
        .spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
        
        .chart-card {
          background-color: rgba(0, 26, 51, 0.6);
          border: 1px solid rgba(34, 211, 238, 0.3);
        }
        
        audio {
          width: 100%;
          height: 40px;
        }
        
        .empty-state-icon {
          font-size: 4rem;
          opacity: 0.5;
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="ocean-bg">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="bubble" 
            style={{
              left: `${(i + 1) * 12}%`, 
              animationDelay: `${i * 2}s`, 
              animationDuration: `${15 + i * 3}s`
            }} 
          />
        ))}
      </div>

      <div className="container py-5" style={{ position: 'relative', zIndex: 10 }}>
        <div className="main-card rounded-4 p-4 shadow-lg">
          {/* Header */}
          <div className="d-flex align-items-center mb-3">
            <div className="whale-icon me-3">🐋</div>
            <div>
              <h1 className="gradient-title mb-1">Whale Call Acoustic Analyzer</h1>
              <p className="text-info mb-0 small">Deep ocean bioacoustic processing & signal enhancement</p>
            </div>
          </div>

          <div className="ocean-divider my-4"></div>

          {/* Info Box */}
          <div className="info-box rounded-3 p-3 mb-4 d-flex">
            <div className="fs-4 me-3">🌊</div>
            <div className="small text-info">
              <strong>Multi-stage processing pipeline:</strong> STFT denoising → Demucs separation → UMX isolation
              <br />
              <span style={{ opacity: 0.8 }}>
                Analyze bandwidth, spectral centroid, noise floor & acoustic signatures
              </span>
            </div>
          </div>

          {/* Upload Section */}
          <div className="row g-3 mb-4">
            <div className="col-md-8">
              <input
                type="file"
                accept=".wav,audio/wav"
                onChange={handleFileChange}
                className="form-control form-control-ocean"
              />
            </div>
            <div className="col-md-4">
              <button
                onClick={handleAnalyze}
                disabled={loading || !file}
                className="btn btn-ocean w-100"
              >
                {loading ? (
                  <>
                    <span className="spinner me-2">◐</span> Analyzing...
                  </>
                ) : (
                  <>📊 Analyze Call</>
                )}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {err && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <span className="fs-5 me-2">⚠️</span>
              <div><strong>Error:</strong> {err}</div>
            </div>
          )}

          {/* Results */}
          {analysis && (
            <>
              {/* Audio Playback */}
              <div className="section-card rounded-3 p-4 mb-4">
                <h2 className="h4 text-info mb-3 d-flex align-items-center">
                  <span className="fs-3 me-2">🎧</span>
                  Audio Comparison
                </h2>
                <div className="row g-3">
                  {methodOrder.map((m) => (
                    <div key={m} className="col-md-6">
                      <AudioRow label={prettyName(m)} url={safeGet(m, "audio_url")} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Features Tables */}
              <div className="section-card rounded-3 p-4 mb-4">
                <h2 className="h4 text-info mb-3 d-flex align-items-center">
                  <span className="fs-3 me-2">📈</span>
                  Acoustic Feature Extraction
                </h2>
                {methodOrder.map((m) => (
                  <MetricsBlock key={m} title={prettyName(m)} data={analysis[m]} />
                ))}
              </div>

              {/* Charts */}
              <div className="mb-4">
                <h2 className="h4 text-info mb-3 d-flex align-items-center">
                  <span className="fs-3 me-2">📊</span>
                  Comparative Signal Analysis
                </h2>
                <div className="row g-3">
                  <div className="col-lg-4">
                    <ChartCard title="RMS Amplitude" data={rmsData} />
                  </div>
                  <div className="col-lg-4">
                    <ChartCard title="Noise Floor (dB)" data={noiseData} />
                  </div>
                  <div className="col-lg-4">
                    <ChartCard title="Bandwidth (Hz)" data={bwData} />
                  </div>
                </div>
              </div>

              {/* Spectrograms */}
              <div className="section-card rounded-3 p-4">
                <h2 className="h4 text-info mb-3 d-flex align-items-center">
                  <span className="fs-3 me-2">🌊</span>
                  Spectrogram Analysis (dB scale)
                </h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <SpectrogramCanvas title="Original (raw)" spec={analysis.original?.spectrogram} />
                  </div>
                  <div className="col-md-6">
                    <SpectrogramCanvas title="STFT cleaned" spec={analysis.stft?.spectrogram} />
                  </div>
                  <div className="col-md-6">
                    <SpectrogramCanvas title="STFT → Demucs" spec={analysis.stft_demucs?.spectrogram} />
                  </div>
                  <div className="col-md-6">
                    <SpectrogramCanvas title="STFT → UMX" spec={analysis.stft_umx?.spectrogram} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {!analysis && !err && !loading && (
            <div className="text-center py-5 text-secondary">
              <div className="empty-state-icon">🐋</div>
              <p>Upload a whale call recording to begin acoustic analysis</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-secondary small">
          <span className="me-2">🌊</span>
          Marine Bioacoustics Research Platform
          <span className="ms-2">🐋</span>
        </div>
      </div>
    </>
  );
}

function prettyName(key) {
  switch (key) {
    case "original": return "Original";
    case "stft": return "STFT Enhanced";
    case "stft_demucs": return "Demucs Separated";
    case "stft_umx": return "UMX Isolated";
    default: return key;
  }
}

function AudioRow({ label, url }) {
  if (!url) return null;
  return (
    <div className="audio-card rounded-3 p-3">
      <div className="text-info fw-bold small text-uppercase mb-2 d-flex align-items-center">
        <span className="me-2">🔊</span>
        {label}
      </div>
      <audio controls src={url}>
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}

function MetricsBlock({ title, data }) {
  if (!data) return null;
  const rows = [
    ["Duration", data.duration_sec, 2, false, "s"],
    ["Low Frequency", data.low_freq_hz, 2, false, "Hz"],
    ["High Frequency", data.high_freq_hz, 2, false, "Hz"],
    ["Bandwidth", data.bandwidth_hz, 2, false, "Hz"],
    ["Spectral Centroid", data.centroid_mean_hz, 2, false, "Hz"],
    ["RMS Amplitude", data.rms_mean, 3, true, ""],
    ["Noise Floor", data.noise_floor_dB, 2, false, "dB"],
    ["Sample Rate", data.sample_rate, 0, false, "Hz"],
  ];

  return (
    <div className="method-card rounded-3 p-3 mb-3">
      <div className="method-title fw-bold pb-2 mb-3">{title}</div>
      <div className="row g-2">
        {rows.map(([label, val, digits, sci, unit], i) => (
          <div key={i} className="col-md-6">
            <MetricRow label={label} value={val} digits={digits} sci={sci} unit={unit} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricRow({ label, value, digits = 2, sci = false, unit = "" }) {
  let out = "-";
  if (value !== undefined && value !== null) {
    const num = Number(value);
    if (!Number.isNaN(num)) {
      out = sci ? num.toExponential(digits) : num.toFixed(digits);
      if (unit) out += ` ${unit}`;
    }
  }

  return (
    <div className="metric-row d-flex justify-content-between py-2">
      <div className="text-info">{label}</div>
      <div className="text-white fw-bold">{out}</div>
    </div>
  );
}

function ChartCard({ title, data }) {
  return (
    <div className="chart-card rounded-3 p-3" style={{ minHeight: '280px' }}>
      <h3 className="h6 text-info text-uppercase mb-3">{title}</h3>
      {data ? (
        <Bar 
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                labels: { color: '#e0f2fe' }
              }
            },
            scales: {
              x: {
                ticks: { color: '#bae6fd' },
                grid: { color: 'rgba(186, 230, 253, 0.1)' }
              },
              y: {
                ticks: { color: '#bae6fd' },
                grid: { color: 'rgba(186, 230, 253, 0.1)' }
              }
            }
          }}
        />
      ) : (
        <div className="text-secondary fst-italic small">Data not available</div>
      )}
    </div>
  );
}

export default App;