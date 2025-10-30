import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError, ErrorCode } from '../types';

/**
 * Validation middleware factory
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const error: ApiError = {
          message: 'Validation failed',
          code: ErrorCode.VALIDATION_ERROR,
          statusCode: 400,
          details: result.error.errors,
        };
        return res.status(400).json({ error });
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Error handling middleware
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Default error response
  let statusCode = 500;
  let errorResponse: ApiError = {
    message: 'Internal server error',
    code: ErrorCode.INTERNAL_ERROR,
    statusCode: 500,
  };

  // Handle known error types
  if (error instanceof Error) {
    if (error.message.includes('Unable to determine SQL dialect')) {
      errorResponse = {
        message: error.message,
        code: ErrorCode.UNSUPPORTED_DIALECT,
        statusCode: 400,
      };
      statusCode = 400;
    } else if (error.message.includes('Failed to parse')) {
      errorResponse = {
        message: error.message,
        code: ErrorCode.PARSE_ERROR,
        statusCode: 400,
      };
      statusCode = 400;
    } else if (error.message.includes('Invalid') || error.message.includes('syntax')) {
      errorResponse = {
        message: error.message,
        code: ErrorCode.INVALID_SQL,
        statusCode: 400,
      };
      statusCode = 400;
    }
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    errorResponse = {
      message: 'Validation failed',
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: 400,
      details: error.errors,
    };
    statusCode = 400;
  }

  // Log error for debugging
  req.log?.error(error, 'Request error');

  res.status(statusCode).json({ error: errorResponse });
}

/**
 * Not found middleware
 */
export function notFoundHandler(req: Request, res: Response) {
  const error: ApiError = {
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
    statusCode: 404,
  };
  
  res.status(404).json({ error });
}