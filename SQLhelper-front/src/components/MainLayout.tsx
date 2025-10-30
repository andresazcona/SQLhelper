import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Header } from './Header';
import { EditorPanel } from './EditorPanel';
import { DiagramPanel } from './DiagramPanel';
import { ErrorBanner } from './ErrorBanner';
import { LoadingOverlay } from './LoadingOverlay';
import './MainLayout.scss';

export const MainLayout: React.FC = () => {
  const { state } = useApp();

  return (
    <div className="app-container">
      <Header />
      
      <main className="app-main">
        <div className="panel editor-panel">
          <EditorPanel />
        </div>
        
        <div className="panel diagram-panel">
          <DiagramPanel />
        </div>
      </main>

      {state.error && <ErrorBanner />}
      {state.isLoading && <LoadingOverlay />}
    </div>
  );
};