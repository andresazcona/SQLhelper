import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { mermaidService } from '../services/mermaid';
import { exportService } from '../services/export';
import './DiagramPanel.scss';

export const DiagramPanel: React.FC = () => {
  const { state, setError } = useApp();
  const diagramRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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
    setPanPosition({ x: 0, y: 0 });
  };

  // Wheel zoom
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      // Regular scroll with Ctrl/Cmd for zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -10 : 10;
        setZoom(prev => {
          const newZoom = Math.max(25, Math.min(300, prev + delta));
          return newZoom;
        });
      } else {
        // Pan with regular scroll
        e.preventDefault();
        setPanPosition(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
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

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        setError(`Error attempting fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);


  return (
    <div className={`diagram-panel-container ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      <div className="panel-header">
        <h2>ER Diagram</h2>
        <div className="panel-actions">
          <button 
            onClick={handleFullscreen}
            className="action-btn secondary"
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div 
        className="diagram-content"
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {state.diagram ? (
          <div 
            className="diagram-container"
            style={{ 
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom / 100})`,
              transformOrigin: 'center center'
            }}
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