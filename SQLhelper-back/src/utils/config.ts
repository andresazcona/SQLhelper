import { AppConfig } from '../types';

/**
 * Application configuration
 */
export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    // In development: allow all origins. In production: use specified CORS_ORIGIN or be conservative
    origin: process.env.NODE_ENV === 'development' 
      ? true  // Allow all origins in development
      : process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000'],
    credentials: true,
    // Some browsers expect a 200 on successful OPTIONS preflight
    optionsSuccessStatus: 200,
    // Explicitly allow common headers
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    // Allow common methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    // Enable preflight caching
    maxAge: 86400, // 24 hours
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP to 100 requests per windowMs
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: process.env.NODE_ENV === 'development',
  },
};

/**
 * Validate required environment variables
 */
export function validateConfig(): void {
  const requiredEnvVars: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required environment variable ${envVar} is not set`);
    }
  }
}