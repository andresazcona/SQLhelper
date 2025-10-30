import React, { useState, useRef } from 'react';
import { useApp, SQL_DIALECTS } from '../contexts/AppContext';
import { sqlParserService } from '../services/sqlParser';
import { mermaidService } from '../services/mermaid';
import './EditorPanel.scss';

export const EditorPanel: React.FC = () => {
  const { state, setSQL, setDialect, setParsedData, setDiagram, setLoading, setError } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSQLChange = (value: string) => {
    setSQL(value);
  };

  const handleDialectChange = (dialectValue: string) => {
    const dialect = SQL_DIALECTS.find(d => d.value === dialectValue);
    if (dialect) {
      setDialect(dialect);
    }
  };

  const handleParseSQL = async () => {
    if (!state.currentSQL.trim()) {
      setError('Please enter SQL code to parse');
      return;
    }

    setLoading('parsing');
    setError(null);

    try {
      // Parse SQL
      const parseResult = await sqlParserService.parseSQL(state.currentSQL, state.selectedDialect);
      
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || 'Failed to parse SQL');
      }

      // El backend devuelve { data: { schema, mermaid, dbml, json } }
      // Extraemos el schema que contiene tables y relationships
      const responseData = parseResult.data as any;
      const schema = responseData.data?.schema || responseData.schema || parseResult.data;
      setParsedData(schema);

      // Generate diagram
      setLoading('generating');
      const diagram = mermaidService.generateERDiagram(schema);
      setDiagram(diagram);

      setLoading('idle');
    } catch (error) {
      console.error('Parse error:', error);
      setError(error instanceof Error ? error.message : 'Failed to parse SQL');
      setLoading('idle');
    }
  };

  const handleLoadSample = () => {
    const sample = sqlParserService.getSampleSQL(state.selectedDialect);
    setSQL(sample);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSQL(content);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const sqlFile = files.find(file => 
      file.name.endsWith('.sql') || 
      file.type === 'text/plain' ||
      file.type === 'application/sql'
    );

    if (sqlFile) {
      handleFileUpload(sqlFile);
    } else {
      setError('Please drop a SQL file (.sql)');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="editor-panel-container">
      <div className="panel-header">
        <h2>SQL Editor</h2>
        <div className="panel-actions">
          <select 
            value={state.selectedDialect.value}
            onChange={(e) => handleDialectChange(e.target.value)}
            className="dialect-selector"
          >
            {SQL_DIALECTS.map(dialect => (
              <option key={dialect.value} value={dialect.value}>
                {dialect.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div 
        className={`sql-input-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          value={state.currentSQL}
          onChange={(e) => handleSQLChange(e.target.value)}
          placeholder="Enter your SQL CREATE TABLE statements here, or drag & drop a .sql file..."
          className="sql-textarea"
          rows={20}
        />
        
        {isDragOver && (
          <div className="drag-overlay">
            <div className="drag-message">
              Drop SQL file here
            </div>
          </div>
        )}
      </div>

      <div className="panel-footer">
        <div className="file-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".sql,.txt"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="action-btn secondary"
          >
            Upload File
          </button>
          <button 
            onClick={handleLoadSample}
            className="action-btn secondary"
          >
            Load Sample
          </button>
        </div>

        <div className="parse-actions">
          <button 
            onClick={() => setSQL('')}
            className="action-btn danger"
            disabled={!state.currentSQL}
          >
            Clear
          </button>
          <button 
            onClick={handleParseSQL}
            className="action-btn primary"
            disabled={!state.currentSQL.trim() || state.isLoading}
          >
            Parse SQL
          </button>
        </div>
      </div>
    </div>
  );
};