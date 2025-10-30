import React from 'react';
import { useApp } from '../contexts/AppContext';
import './LoadingOverlay.scss';

export const LoadingOverlay: React.FC = () => {
  const { state } = useApp();

  if (!state.isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="spinner"></div>
        <div className="loading-text">Processing SQL...</div>
      </div>
    </div>
  );
};