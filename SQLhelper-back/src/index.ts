import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import pino from 'pino';
import swaggerUi from 'swagger-ui-express';
// @ts-ignore - swagger-jsdoc doesn't have types
import swaggerJSDoc from 'swagger-jsdoc';

import { config, validateConfig } from './utils/config';
import { apiRoutes } from './routes/api';
import { errorHandler, notFoundHandler } from './middleware/validation';

// Validate configuration
validateConfig();

// Create Express app
const app = express();

// Create logger
const logger = pino({
  level: config.logging.level,
  transport: config.logging.prettyPrint
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      }
    : undefined,
});

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'SQLhelper',
      version: '1.0.0',
      description: 'REST API for parsing SQL DDL and converting to multiple diagram formats',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        SqlDialect: {
          type: 'string',
          enum: ['mysql', 'postgres', 'mssql', 'sqlite', 'oracle'],
        },
        DetectRequest: {
          type: 'object',
          required: ['sql'],
          properties: {
            sql: {
              type: 'string',
              description: 'SQL DDL statements to analyze',
              minLength: 1,
              maxLength: 100000,
            },
          },
        },
        DetectResponse: {
          type: 'object',
          properties: {
            dialect: {
              oneOf: [
                { $ref: '#/components/schemas/SqlDialect' },
                { type: 'string', enum: ['unknown'] },
              ],
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confidence score (0-1)',
            },
            reasons: {
              type: 'array',
              items: { type: 'string' },
              description: 'Reasons for dialect detection',
            },
          },
        },
        ParseRequest: {
          type: 'object',
          required: ['sql'],
          properties: {
            sql: {
              type: 'string',
              description: 'SQL DDL statements to parse',
              minLength: 1,
              maxLength: 100000,
            },
            dialect: {
              $ref: '#/components/schemas/SqlDialect',
              description: 'Force specific dialect (optional)',
            },
            options: {
              type: 'object',
              properties: {
                inferDialect: {
                  type: 'boolean',
                  default: true,
                  description: 'Whether to infer dialect if not specified',
                },
                includeIndexes: {
                  type: 'boolean',
                  default: true,
                  description: 'Whether to include index definitions',
                },
                includeActions: {
                  type: 'boolean',
                  default: true,
                  description: 'Whether to include ON UPDATE/DELETE actions',
                },
                strict: {
                  type: 'boolean',
                  default: false,
                  description: 'Whether to fail on parse errors',
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Middleware
// Apply CORS before other middleware to ensure preflight and actual requests work
app.use(cors(config.cors));

// Additional CORS middleware to ensure headers are always set in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    // Always set CORS headers for development
    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }
    next();
  });
}

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parsing error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON syntax',
      details: 'Request body contains malformed JSON',
    });
  }
  next(err);
});

// Logging middleware
app.use(pinoHttp({ logger }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: false, // Disable standard headers
  legacyHeaders: true, // Enable legacy X-RateLimit-* headers
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api', apiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port}`);
  logger.info(`📚 API Documentation available at http://localhost:${config.port}/docs`);
  logger.info(`🏥 Health check available at http://localhost:${config.port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

export default app;