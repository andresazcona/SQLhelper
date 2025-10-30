import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { mermaidService } from '../services/mermaid';
import { exportService } from '../services/export';
import './DiagramPanel.scss';

export const DiagramPanel: React.FC = () => {
  const { state, setError } = useApp();
  const diagramRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (state.diagram && diagramRef.current) {
      renderDiagram();
    }
  }, [state.diagram, state.theme]);

  const renderDiagram = async () => {
    if (!state.diagram || !diagramRef.current) return;

    try {
      // Update mermaid theme based on app theme
      mermaidService.updateTheme(state.theme);
      
      // Render the diagram
      await mermaidService.renderDiagram(state.diagram.code, 'mermaid-diagram');
    } catch (error) {
      console.error('Diagram rendering error:', error);
      setError(error instanceof Error ? error.message : 'Failed to render diagram');
    }
  };

  const handleZoomIn = () => {
    if (zoom < 200) {
      setZoom(prev => prev + 25);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 50) {
      setZoom(prev => prev - 25);
    }
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  const handleSave = async (format: 'mermaid' | 'svg' | 'png') => {
    if (!state.diagram) return;

    try {
      if (format === 'mermaid') {
        exportService.exportMermaidCode(state.diagram, 'sqlhelper-diagram.mmd');
      } else if (format === 'svg') {
        await exportService.exportAsSVG('mermaid-diagram', 'sqlhelper-diagram.svg');
      } else if (format === 'png') {
        await exportService.exportAsPNG('mermaid-diagram', 'sqlhelper-diagram.png');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save diagram');
    }
  };


  return (
    <div className="diagram-panel-container">
      <div className="panel-header">
        <h2>ER Diagram</h2>
        <div className="panel-actions">
          <button 
            onClick={() => setShowCode(!showCode)}
            className="action-btn secondary"
            title="Toggle code view"
          >
            {showCode ? 'Diagram' : 'Code'}
          </button>
        </div>
      </div>

      {showCode && state.diagram ? (
        <div className="code-view">
          <pre className="mermaid-code">
            {state.diagram.code}
          </pre>
        </div>
      ) : (
        <div className="diagram-content">
          {state.diagram ? (
            <div 
              className="diagram-container"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div 
                id="mermaid-diagram" 
                ref={diagramRef}
                className="mermaid-output"
              />
            </div>
          ) : (
            <div className="empty-state">
              <h3>No Diagram Yet</h3>
              <p>Parse your SQL to generate an ER diagram</p>
            </div>
          )}
        </div>
      )}

      <div className="panel-footer">
        <div className="zoom-controls">
          <button 
            onClick={handleZoomOut}
            className="action-btn secondary"
            disabled={zoom <= 50}
            title="Zoom out"
          >
            -
          </button>
          <span className="zoom-level">{zoom}%</span>
          <button 
            onClick={handleZoomIn}
            className="action-btn secondary"
            disabled={zoom >= 200}
            title="Zoom in"
          >
            +
          </button>
          <button 
            onClick={handleZoomReset}
            className="action-btn reset-btn"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>

        <div className="export-actions">
          <div className="save-control">
            <select
              className="format-select"
              defaultValue="png"
              aria-label="Select save format"
            >
              <option value="mermaid">Code</option>
              <option value="svg">SVG</option>
              <option value="png">PNG</option>
            </select>

            <button
              className="action-btn primary save-btn"
              onClick={() => {
                const sel = document.querySelector('.format-select') as HTMLSelectElement | null;
                const format = (sel?.value as 'mermaid' | 'svg' | 'png') || 'png';
                handleSave(format);
              }}
              disabled={!state.diagram}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};