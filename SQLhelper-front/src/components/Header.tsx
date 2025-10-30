import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useApiHealth } from '../hooks/useApiHealth';
import logo from '../assets/logo.png';
import './Header.scss';

export const Header: React.FC = () => {
  const { state, toggleTheme } = useApp();
  const { isHealthy, isChecking } = useApiHealth(30000); // Check every 30 seconds

  return (
    <header className="app-header">
      <h1 className="app-title">
        <img src={logo} alt="SQLhelper Logo" className="app-logo" />
      </h1>

      <div className="header-actions">
        {/* API Health Status */}
        <div className={`api-status ${isHealthy ? 'api-ready' : 'api-unready'} ${isChecking ? 'checking' : ''}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {isChecking ? 'Checking API...' : isHealthy ? 'API Ready' : 'API Unready'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button 
          className="action-btn theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${state.theme === 'light' ? 'dark' : 'light'} theme`}
          aria-label="Toggle theme"
        >
          {state.theme === 'light' ? (
            // Moon icon for switching to dark
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
            </svg>
          ) : (
            // Sun icon for switching to light - simple and clean
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <circle cx="12" cy="12" r="5" fill="currentColor"/>
              <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};