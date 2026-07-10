import React, { useRef, useState, useEffect } from 'react';
import { Undo2, Redo2, Edit3, Eraser as EraserIcon, RotateCcw } from 'lucide-react';

const DrawingCanvas = ({ onSave }) => {
  const canvasRef = useRef(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [eraserWidth, setEraserWidth] = useState(15);

  // History stack for Undo/Redo
  const historyRef = useRef([]);
  const indexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set clean white background by default
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Save initial blank canvas state
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [imgData];
    indexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    
    // Scale coordinates to match internal canvas resolution vs CSS displayed size
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    
    return { x, y };
  };

  const startDrawing = (e) => {
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    
    // Set stroke properties based on selected tool
    if (tool === 'eraser') {
      ctx.strokeStyle = '#ffffff'; // White background color to erase
      ctx.lineWidth = eraserWidth;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
    
    setIsDrawing(true);
    e.preventDefault();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
      
      // Save canvas snapshot to history stack
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const newHistory = historyRef.current.slice(0, indexRef.current + 1);
      newHistory.push(imgData);
      historyRef.current = newHistory;
      indexRef.current = newHistory.length - 1;
      
      setCanUndo(true);
      setCanRedo(false);
      
      // Save base64 URL to parent state
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleUndo = () => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(historyRef.current[indexRef.current], 0, 0);
      
      setCanUndo(indexRef.current > 0);
      setCanRedo(true);
      
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleRedo = () => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(historyRef.current[indexRef.current], 0, 0);
      
      setCanUndo(true);
      setCanRedo(indexRef.current < historyRef.current.length - 1);
      
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save cleared state to history
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = historyRef.current.slice(0, indexRef.current + 1);
    newHistory.push(imgData);
    historyRef.current = newHistory;
    indexRef.current = newHistory.length - 1;
    
    setCanUndo(true);
    setCanRedo(false);
    onSave(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Tools Panel */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.5rem', opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ padding: '0.35rem 0.5rem', opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'not-allowed' }}
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

        {/* Pen vs Eraser Tools */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button 
            type="button" 
            className={`btn ${tool === 'pen' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => setTool('pen')}
          >
            <Edit3 size={14} /> Pen
          </button>
          <button 
            type="button" 
            className={`btn ${tool === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onClick={() => setTool('eraser')}
          >
            <EraserIcon size={14} /> Eraser
          </button>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

        {/* Dynamic Controls based on selected tool */}
        {tool === 'pen' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Color:</span>
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                style={{ width: '28px', height: '24px', border: 'none', cursor: 'pointer', padding: 0, borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Size:</span>
              <input 
                type="range" 
                min="1" 
                max="12" 
                value={lineWidth} 
                onChange={(e) => setLineWidth(parseInt(e.target.value))} 
                style={{ width: '70px', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lineWidth}px</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Eraser Size:</span>
            <input 
              type="range" 
              min="5" 
              max="40" 
              value={eraserWidth} 
              onChange={(e) => setEraserWidth(parseInt(e.target.value))} 
              style={{ width: '80px', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{eraserWidth}px</span>
          </div>
        )}

        <button 
          type="button" 
          className="btn btn-secondary" 
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          onClick={clearCanvas}
          title="Clear All"
        >
          <RotateCcw size={14} /> Clear Board
        </button>
      </div>

      {/* Canvas Pad */}
      <canvas
        ref={canvasRef}
        width={500}
        height={320}
        style={{
          border: '2px dashed var(--border)',
          borderRadius: '8px',
          background: '#ffffff',
          cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          touchAction: 'none',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
          maxWidth: '100%',
          display: 'block'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
};

export default DrawingCanvas;
