import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

// Check if we're in test environment
const isTestEnv = env.NODE_ENV === 'test';

/**
 * Rate limiting configurations
 */

// General API rate limiter
export const generalRateLimit = rateLimit({
  windowMs: isTestEnv ? 60 * 1000 : 15 * 60 * 1000, // 1 minute for tests, 15 minutes for production
  max: isTestEnv ? 10000 : 1000, // Much higher limit for tests
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again later',
    errors: [{ field: 'rateLimit', message: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }],
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many requests from this IP, please try again later',
      errors: [{ field: 'rateLimit', message: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }],
    });
  },
});

// Authentication rate limiter (stricter)
export const authRateLimit = rateLimit({
  windowMs: isTestEnv ? 60 * 1000 : 15 * 60 * 1000, // 1 minute for tests, 15 minutes for production
  max: isTestEnv ? 1000 : 5, // Much higher limit for tests
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts, please try again later',
    errors: [{ field: 'authRateLimit', message: 'Auth rate limit exceeded', code: 'AUTH_RATE_LIMIT_EXCEEDED' }],
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many authentication attempts, please try again later',
      errors: [{ field: 'authRateLimit', message: 'Auth rate limit exceeded', code: 'AUTH_RATE_LIMIT_EXCEEDED' }],
    });
  },
});

// Password reset rate limiter
export const passwordResetRateLimit = rateLimit({
  windowMs: isTestEnv ? 60 * 1000 : 60 * 60 * 1000, // 1 minute for tests, 1 hour for production
  max: isTestEnv ? 1000 : 3, // Much higher limit for tests
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many password reset attempts, please try again later',
    errors: [{ field: 'passwordResetRateLimit', message: 'Password reset rate limit exceeded', code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED' }],
  },
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many password reset attempts, please try again later',
      errors: [{ field: 'passwordResetRateLimit', message: 'Password reset rate limit exceeded', code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED' }],
    });
  },
});

// File upload rate limiter
export const fileUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 file uploads per hour
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many file uploads, please try again later',
    errors: [{ field: 'fileUploadRateLimit', message: 'File upload rate limit exceeded', code: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED' }],
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many file uploads, please try again later',
      errors: [{ field: 'fileUploadRateLimit', message: 'File upload rate limit exceeded', code: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED' }],
    });
  },
});

// Sync rate limiter
export const syncRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 sync requests per window
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many sync requests, please try again later',
    errors: [{ field: 'syncRateLimit', message: 'Sync rate limit exceeded', code: 'SYNC_RATE_LIMIT_EXCEEDED' }],
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many sync requests, please try again later',
      errors: [{ field: 'syncRateLimit', message: 'Sync rate limit exceeded', code: 'SYNC_RATE_LIMIT_EXCEEDED' }],
    });
  },
});

/**
 * Slow down configurations
 * Gradually slows down responses as rate limit is approached
 */

// General slow down
export const generalSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 500, // Allow 500 requests per 15 minutes at full speed
  maxDelayMs: 1000, // Add 1 second delay after delayAfter requests
  delayMs: 100, // Add 100ms delay per request after delayAfter
});

// Auth slow down
export const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 3, // Allow 3 auth requests at full speed
  maxDelayMs: 5000, // Add 5 seconds delay after delayAfter requests
  delayMs: 1000, // Add 1 second delay per request after delayAfter
});

/**
 * Custom rate limiting middleware
 * Rate limits based on user ID when authenticated
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const userRequests = requests.get(key || '');

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(key || '', {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        statusCode: 429,
        message: 'Rate limit exceeded',
        errors: [{ field: 'userRateLimit', message: 'User rate limit exceeded', code: 'USER_RATE_LIMIT_EXCEEDED' }],
      });
    }

    userRequests.count++;
    next();
  };
};

/**
 * API key rate limiting middleware
 * For API key based authentication
 */
export const apiKeyRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return next();
    }

    const now = Date.now();
    const keyRequests = requests.get(apiKey);

    if (!keyRequests || now > keyRequests.resetTime) {
      requests.set(apiKey, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (keyRequests.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        statusCode: 429,
        message: 'API key rate limit exceeded',
        errors: [{ field: 'apiKeyRateLimit', message: 'API key rate limit exceeded', code: 'API_KEY_RATE_LIMIT_EXCEEDED' }],
      });
    }

    keyRequests.count++;
    next();
  };
};

/**
 * Dynamic rate limiting middleware
 * Adjusts rate limits based on user tier or other factors
 */
export const dynamicRateLimit = (getLimits: (req: Request) => { max: number; windowMs: number }) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.id || req.ip;
    const { max, windowMs } = getLimits(req);
    const now = Date.now();
    const userRequests = requests.get(key || '');

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(key || '', {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userRequests.count >= max) {
      return res.status(429).json({
        success: false,
        statusCode: 429,
        message: 'Rate limit exceeded',
        errors: [{ field: 'dynamicRateLimit', message: 'Dynamic rate limit exceeded', code: 'DYNAMIC_RATE_LIMIT_EXCEEDED' }],
      });
    }

    userRequests.count++;
    next();
  };
};

/**
 * Rate limiting middleware factory
 * Creates rate limiting middleware with custom options
 */
export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      statusCode: 429,
      message: options.message || 'Rate limit exceeded',
      errors: [{ field: 'rateLimit', message: options.message || 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }],
    },
    skipSuccessfulRequests: options.skipSuccessfulRequests,
    skipFailedRequests: options.skipFailedRequests,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        statusCode: 429,
        message: options.message || 'Rate limit exceeded',
        errors: [{ field: 'rateLimit', message: options.message || 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' }],
      });
    },
  });
};

/**
 * Rate limit bypass middleware
 * Allows certain IPs or users to bypass rate limits
 */
export const rateLimitBypass = (bypassList: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    const userId = req.user?.id;
    
    if (bypassList.includes(ip || '') || (userId && bypassList.includes(userId))) {
      // Set a flag to bypass rate limiting
      (req as any).bypassRateLimit = true;
    }
    
    next();
  };
};

/**
 * Rate limit status middleware
 * Adds rate limit headers to response
 */
export const rateLimitStatus = (req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    const rateLimitInfo = (req as any).rateLimit;
    if (rateLimitInfo) {
      res.setHeader('X-RateLimit-Limit', rateLimitInfo.limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimitInfo.limit - rateLimitInfo.current));
      res.setHeader('X-RateLimit-Reset', rateLimitInfo.resetTime);
    }
  });
  
  next();
};
