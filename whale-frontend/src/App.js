import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

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

      // NOTE: backend must be running on this URL
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error || `Request failed with ${res.status}`);
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={{ marginBottom: "0.5rem" }}>🐋 Whale Call Analyzer</h1>
        <p style={{ marginTop: 0, color: "#666" }}>
          Upload a whale call (.wav). We'll denoise and extract acoustic
          features from the call.
        </p>

        <div style={styles.section}>
          <input
            type="file"
            accept=".wav,audio/wav"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !file}
            style={styles.button}
          >
            {loading ? "Analyzing..." : "Analyze call"}
          </button>
        </div>

        {err && (
          <div style={styles.errorBox}>
            <strong>Error: </strong> {err}
          </div>
        )}

        {analysis && (
          <div style={styles.resultsBox}>
            <h2 style={{ marginTop: 0 }}>Analysis Results</h2>

            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>Duration (s)</span>
              <span style={styles.resultValue}>
                {analysis.duration_sec?.toFixed(3)}
              </span>
            </div>

            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>RMS mean</span>
              <span style={styles.resultValue}>
                {analysis.rms_mean?.toExponential(3)}
              </span>
            </div>

            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>Centroid (Hz)</span>
              <span style={styles.resultValue}>
                {analysis.centroid_mean_hz?.toFixed(2)}
              </span>
            </div>

            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>Low freq (Hz)</span>
              <span style={styles.resultValue}>
                {analysis.low_freq_hz?.toFixed(2)}
              </span>
            </div>

            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>High freq (Hz)</span>
              <span style={styles.resultValue}>
                {analysis.high_freq_hz?.toFixed(2)}
              </span>
            </div>

            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>Bandwidth (Hz)</span>
              <span style={styles.resultValue}>
                {analysis.bandwidth_hz?.toFixed(2)}
              </span>
            </div>

            <div style={styles.resultRow}>
              <span style={styles.resultLabel}>Sample Rate</span>
              <span style={styles.resultValue}>
                {analysis.sample_rate} Hz
              </span>
            </div>

            <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#777" }}>
              <div>Cleaned audio saved (server-side):</div>
              <code>{analysis.cleaned_file}</code>
            </div>
          </div>
        )}

        {!analysis && !err && !loading && (
          <div style={{ fontSize: "0.8rem", color: "#999", marginTop: "2rem" }}>
            No analysis yet.
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 20% 30%, #0f172a 0%, #1e293b 60%, #000 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Inter", "Roboto", "Helvetica", sans-serif',
    color: "#fff",
    padding: "2rem",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: "1rem",
    boxShadow:
      "0 30px 80px rgba(0,0,0,0.7), 0 2px 4px rgba(255,255,255,0.05) inset",
    padding: "1.5rem 2rem",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginTop: "1rem",
    marginBottom: "1rem",
  },
  fileInput: {
    backgroundColor: "#1e293b",
    color: "#fff",
    borderRadius: "0.5rem",
    padding: "0.75rem",
    border: "1px solid rgba(255,255,255,0.2)",
    fontSize: "0.9rem",
  },
  button: {
    backgroundColor: "#38bdf8",
    border: 0,
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    color: "#0f172a",
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: "0.5rem",
    padding: "0.75rem",
    color: "#fecaca",
    fontSize: "0.9rem",
  },
  resultsBox: {
    backgroundColor: "rgba(30,41,59,0.6)",
    borderRadius: "0.75rem",
    padding: "1rem 1rem",
    border: "1px solid rgba(255,255,255,0.07)",
    marginTop: "1rem",
    fontSize: "0.9rem",
  },
  resultRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.4rem",
    fontFamily: "monospace",
  },
  resultLabel: {
    color: "#94a3b8",
    marginRight: "1rem",
  },
  resultValue: {
    color: "#fff",
    fontWeight: 500,
  },
};

export default App;
