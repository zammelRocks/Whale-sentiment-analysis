import React, { useRef, useEffect } from "react";

// Enhanced ocean-themed dB -> RGB mapping
function colorForDB(db) {
  const clamped = Math.max(-80, Math.min(0, db));
  const t = (clamped + 80) / 80; // 0..1 (0 = quietest, 1 = loudest)
  
  // Ocean color palette: deep blue -> cyan -> bright cyan/white for peaks
  let r, g, b;
  
  if (t < 0.3) {
    // Deep ocean blue (quiet signals)
    r = Math.floor(0 + t * 60);
    g = Math.floor(20 + t * 80);
    b = Math.floor(60 + t * 150);
  } else if (t < 0.6) {
    // Transitioning to cyan (medium signals)
    const localT = (t - 0.3) / 0.3;
    r = Math.floor(18 + localT * 50);
    g = Math.floor(44 + localT * 140);
    b = Math.floor(105 + localT * 140);
  } else if (t < 0.85) {
    // Bright cyan/aqua (strong signals)
    const localT = (t - 0.6) / 0.25;
    r = Math.floor(68 + localT * 90);
    g = Math.floor(184 + localT * 50);
    b = Math.floor(245 + localT * 10);
  } else {
    // Peak signals - bright cyan to white
    const localT = (t - 0.85) / 0.15;
    r = Math.floor(158 + localT * 97);
    g = Math.floor(234 + localT * 21);
    b = Math.floor(255);
  }
  
  return [r, g, b];
}

export default function SpectrogramCanvas({ spec, title }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!spec || !spec.db || spec.db.length === 0) return;
    const db2d = spec.db; // [F][T]
    const F = db2d.length;
    const T = db2d[0].length;
    const scale = 3;
    
    // Margins for axes
    const marginLeft = 60;
    const marginBottom = 40;
    const marginTop = 20;
    const marginRight = 20;
    
    const spectWidth = T * scale;
    const spectHeight = F * scale;
    const width = spectWidth + marginLeft + marginRight;
    const height = spectHeight + marginTop + marginBottom;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    
    // Fill background
    ctx.fillStyle = 'rgba(0, 10, 20, 0.95)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw spectrogram
    const imgData = ctx.createImageData(spectWidth, spectHeight);
    const data = imgData.data;

    for (let f = 0; f < F; f++) {
      for (let t = 0; t < T; t++) {
        const [r, g, b] = colorForDB(db2d[f][t]);
        for (let yy = 0; yy < scale; yy++) {
          for (let xx = 0; xx < scale; xx++) {
            const x = t * scale + xx;
            const y = (F - 1 - f) * scale + yy; // low freq at bottom
            const i = (y * spectWidth + x) * 4;
            data[i + 0] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imgData, marginLeft, marginTop);
    
    // Get axis info from spec
    const freqs = spec.freqs || [];
    const times = spec.times || [];
    const maxFreq = freqs.length > 0 ? freqs[freqs.length - 1] : F;
    const maxTime = times.length > 0 ? times[times.length - 1] : T;
    
    // Draw axes
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#bae6fd';
    ctx.font = '11px monospace';
    
    // Y-axis (frequency)
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, marginTop + spectHeight);
    ctx.stroke();
    
    // Y-axis labels (frequency)
    const numFreqLabels = 5;
    for (let i = 0; i <= numFreqLabels; i++) {
      const freqVal = (maxFreq / numFreqLabels) * i;
      const yPos = marginTop + spectHeight - (spectHeight / numFreqLabels) * i;
      
      ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
      ctx.beginPath();
      ctx.moveTo(marginLeft - 5, yPos);
      ctx.lineTo(marginLeft, yPos);
      ctx.stroke();
      
      ctx.fillStyle = '#bae6fd';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(freqVal.toFixed(0), marginLeft - 8, yPos);
    }
    
    // Y-axis label
    ctx.save();
    ctx.translate(15, marginTop + spectHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Frequency (Hz)', 0, 0);
    ctx.restore();
    
    // X-axis (time)
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop + spectHeight);
    ctx.lineTo(marginLeft + spectWidth, marginTop + spectHeight);
    ctx.stroke();
    
    // X-axis labels (time)
    const numTimeLabels = 5;
    for (let i = 0; i <= numTimeLabels; i++) {
      const timeVal = (maxTime / numTimeLabels) * i;
      const xPos = marginLeft + (spectWidth / numTimeLabels) * i;
      
      ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
      ctx.beginPath();
      ctx.moveTo(xPos, marginTop + spectHeight);
      ctx.lineTo(xPos, marginTop + spectHeight + 5);
      ctx.stroke();
      
      ctx.fillStyle = '#bae6fd';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(timeVal.toFixed(1), xPos, marginTop + spectHeight + 8);
    }
    
    // X-axis label
    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Time (s)', marginLeft + spectWidth / 2, marginTop + spectHeight + 28);
    
  }, [spec]);

  return (
    <>
      <style>{`
        .spectrogram-card {
          background: linear-gradient(135deg, rgba(0, 26, 51, 0.8) 0%, rgba(3, 105, 161, 0.6) 100%);
          border: 1px solid rgba(34, 211, 238, 0.4);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        
        .spectrogram-card:hover {
          border-color: rgba(34, 211, 238, 0.6);
          box-shadow: 0 8px 24px rgba(34, 211, 238, 0.2);
          transform: translateY(-2px);
        }
        
        .spectrogram-title {
          color: #7dd3fc;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid rgba(34, 211, 238, 0.3);
        }
        
        .spectrogram-canvas {
          border: 2px solid rgba(34, 211, 238, 0.3);
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1);
          background: rgba(0, 10, 20, 0.8);
          display: block;
          max-width: 100%;
          height: auto;
        }
        
        .spectrogram-label {
          color: #bae6fd;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          opacity: 0.9;
        }
        
        .spectrogram-empty {
          color: #64748b;
          font-style: italic;
          padding: 3rem 1rem;
          background: rgba(0, 10, 20, 0.4);
          border-radius: 0.5rem;
          border: 1px dashed rgba(34, 211, 238, 0.2);
        }
        
        .color-legend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding: 0.5rem;
          background: rgba(0, 10, 20, 0.5);
          border-radius: 0.375rem;
          border: 1px solid rgba(34, 211, 238, 0.2);
        }
        
        .legend-gradient {
          flex: 1;
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(to right, 
            rgb(0, 20, 60),
            rgb(18, 44, 105),
            rgb(68, 184, 245),
            rgb(158, 234, 255),
            rgb(255, 255, 255)
          );
          border: 1px solid rgba(34, 211, 238, 0.3);
        }
        
        .legend-label {
          font-size: 0.7rem;
          color: #94a3b8;
          white-space: nowrap;
        }
      `}</style>
      
      <div className="spectrogram-card rounded-3 p-3 h-100">
        <h6 className="spectrogram-title">{title}</h6>
        {(!spec || !spec.db || spec.db.length === 0) ? (
          <div className="spectrogram-empty text-center">
            <div className="mb-2">🌊</div>
            No spectrogram data available
          </div>
        ) : (
          <>
            <div style={{ width: '100%', overflow: 'hidden', borderRadius: '0.5rem' }}>
              <canvas ref={canvasRef} className="spectrogram-canvas" style={{ width: '100%', height: 'auto' }} />
            </div>

            <div className="color-legend">
              <span className="legend-label">-80 dB</span>
              <div className="legend-gradient"></div>
              <span className="legend-label">0 dB</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}