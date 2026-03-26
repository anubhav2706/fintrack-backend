import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { logger } from '../config/env';

/**
 * Global error handling middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let err = { ...error };
  err.message = error.message;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = 'Validation failed';
    const errors = Object.values((error as any).errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      code: 'VALIDATION_ERROR',
    }));
    
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message,
      errors,
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Mongoose duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue)[0];
    const message = `${field} already exists`;
    
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message,
      errors: [{ field, message, code: 'DUPLICATE_KEY' }],
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Mongoose cast error
  if (error.name === 'CastError') {
    const message = 'Resource not found';
    
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message,
      errors: [{ field: 'id', message, code: 'CAST_ERROR' }],
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message,
      errors: [{ field: 'token', message, code: 'INVALID_TOKEN' }],
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  if (error.name === 'TokenExpiredError') {
    const message = 'Token expired';
    
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message,
      errors: [{ field: 'token', message, code: 'TOKEN_EXPIRED' }],
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Multer errors
  if (error.name === 'MulterError') {
    let message = 'File upload error';
    
    if ((error as any).code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large';
    } else if ((error as any).code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    } else if ((error as any).code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }
    
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message,
      errors: [{ field: 'file', message, code: (error as any).code }],
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Custom ApiError
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
      errors: error.errors,
      ...(env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }

  // Default error
  const statusCode = (err as any).statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : (err as any).message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: (err as any).errors || [],
    ...(env.NODE_ENV === 'development' && { stack: (err as any).stack }),
  });
};

/**
 * 404 Not Found middleware
 * Handles requests to non-existent routes
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  (error as any).statusCode = 404;
  next(error);
};

/**
 * Async error wrapper
 * Wraps async functions to catch errors and pass them to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request logging middleware
 * Logs all incoming requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
    });
  });
  
  next();
};

/**
 * Security headers middleware
 * Adds security-related HTTP headers
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

/**
 * CORS middleware
 * Handles Cross-Origin Resource Sharing
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if CORS is enabled
  if (!env.CORS_ENABLED) {
    return next();
  }
  
  const origin = req.headers.origin;
  const allowedOrigins = env.ALLOWED_ORIGINS || ['http://localhost:3000'];
  
  // Always set CORS headers when enabled
  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // If no origin header, set the first allowed origin
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * Request timeout middleware
 * Times out long-running requests
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          statusCode: 408,
          message: 'Request timeout',
          errors: [{ field: 'request', message: 'Request took too long to process', code: 'TIMEOUT' }],
        });
      }
    }, timeoutMs);
    
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
};

/**
 * Health check middleware
 * Provides health status endpoint
 */
export const healthCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.url === '/health') {
    return res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected', // Would check actual DB connection
        firebase: 'connected', // Would check actual Firebase connection
      },
    });
  }
  
  next();
};
