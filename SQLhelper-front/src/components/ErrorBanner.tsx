import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import './ErrorBanner.scss';

export const ErrorBanner: React.FC = () => {
  const { state, setError } = useApp();
  const [visible, setVisible] = useState(false);
  const autoDismissRef = useRef<number | null>(null);
  const cleanupRef = useRef<number | null>(null);
  const ANIM_DURATION = 300; // ms, should match CSS transition

  useEffect(() => {
    // when a new error appears, show the banner and schedule auto-dismiss
    if (state.error) {
      // ensure visible triggers enter animation
      // small tick to allow mounting before adding visible class
      requestAnimationFrame(() => setVisible(true));

      // clear previous timers
      if (autoDismissRef.current) window.clearTimeout(autoDismissRef.current);
      if (cleanupRef.current) window.clearTimeout(cleanupRef.current);

      // after 3s start exit animation
      autoDismissRef.current = window.setTimeout(() => {
        setVisible(false);
        // after animation completes, clear the error from context
        cleanupRef.current = window.setTimeout(() => {
          setError(null);
        }, ANIM_DURATION);
      }, 3000);
    }

    return () => {
      if (autoDismissRef.current) window.clearTimeout(autoDismissRef.current);
      if (cleanupRef.current) window.clearTimeout(cleanupRef.current);
    };
  }, [state.error, setError]);

  if (!state.error) return null;

  return (
    <div className={`error-banner ${visible ? 'visible' : 'hidden'}`}>
      <span className="error-text">{state.error}</span>
    </div>
  );
};