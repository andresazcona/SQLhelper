import { useState, useEffect, useCallback } from 'react';

interface ApiHealthStatus {
  isHealthy: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');

export const useApiHealth = (checkInterval: number = 30000) => {
  const [status, setStatus] = useState<ApiHealthStatus>({
    isHealthy: false,
    isChecking: true,
    lastChecked: null,
  });

  const checkHealth = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));
    
    try {
      // Construir la URL correcta para el health check
      // Si estamos en desarrollo con proxy (/api), usar la ruta absoluta al puerto 3000
      // Si no, construir desde API_BASE_URL
      let healthUrl: string;
      
      if (import.meta.env.DEV && API_BASE_URL === '/api') {
        // En desarrollo con proxy, ir directamente al backend
        healthUrl = 'http://localhost:3000/health';
      } else {
        // En producción o con URL absoluta configurada
        healthUrl = API_BASE_URL.replace(/\/api$/, '/health');
      }

      console.log('[ApiHealth] Checking health at:', healthUrl);

      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
        // No usar credenciales ni proxy para health check directo
        mode: 'cors',
      });

      const isHealthy = response.ok;
      console.log('[ApiHealth] Health check result:', isHealthy ? 'HEALTHY' : 'UNHEALTHY');
      
      setStatus({
        isHealthy,
        isChecking: false,
        lastChecked: new Date(),
      });

      return isHealthy;
    } catch (error) {
      console.error('[ApiHealth] Health check failed:', error);
      setStatus({
        isHealthy: false,
        isChecking: false,
        lastChecked: new Date(),
      });
      return false;
    }
  }, []);

  useEffect(() => {
    // Check immediately on mount
    checkHealth();

    // Set up periodic health checks
    const intervalId = setInterval(checkHealth, checkInterval);

    return () => clearInterval(intervalId);
  }, [checkHealth, checkInterval]);

  return {
    ...status,
    checkHealth, // Allow manual health check
  };
};
