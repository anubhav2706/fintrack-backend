import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Authentication middleware
 * Verifies JWT tokens and attaches user to request object
 */
export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // 1. Get token from header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : undefined;

  if (!token) {
    throw ApiError.unauthorized('Access token is required');
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string; iat: number; exp: number };

    // 3. Check if user still exists
    const user = await User.findById(decoded.userId).select('-passwordHash -passcode -emailVerifyToken -passwordResetToken -passwordResetExpires');
    
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid or expired token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Token expired');
    }
    throw error;
  }
});

/**
 * Optional authentication middleware
 * Attaches user to request if token is provided, but doesn't throw error
 */
export const optionalAuth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : undefined;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId).select('-passwordHash -passcode -emailVerifyToken -passwordResetToken -passwordResetExpires');
    
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
});

/**
 * Verify refresh token middleware
 */
export const verifyRefreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
    
    // Here you would typically check against a token store (Redis/database)
    // For now, we'll just verify the token signature
    
    req.body.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Refresh token expired');
    }
    throw error;
  }
});

/**
 * Check if user is verified (email verified)
 */
export const requireEmailVerified = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isEmailVerified) {
    throw ApiError.forbidden('Email verification required');
  }
  next();
});

/**
 * Check if user has completed onboarding
 */
export const requireOnboarding = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.onboardingDone) {
    throw ApiError.forbidden('Onboarding required');
  }
  next();
});

/**
 * Check if user has biometric enabled (for biometric routes)
 */
export const requireBiometric = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.biometricEnabled) {
    throw ApiError.forbidden('Biometric authentication not enabled');
  }
  next();
});

/**
 * Rate limiting middleware for authentication routes
 */
export const authRateLimit = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // This would typically use a rate limiting library like express-rate-limit
  // For now, we'll just pass through
  next();
});

/**
 * Middleware to check user permissions for specific resources
 */
export const checkResourceOwnership = (resourceField = 'userId') => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    
    if (userId !== resourceUserId) {
      throw ApiError.forbidden('Access denied: You can only access your own resources');
    }
    
    next();
  });
};

/**
 * Middleware to validate device sync permissions
 */
export const validateDeviceSync = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { deviceId } = req.body;
  const userId = req.user?.id;
  
  if (!deviceId || !userId) {
    throw ApiError.badRequest('Device ID and user ID are required');
  }
  
  // Here you would typically validate the device belongs to the user
  // For now, we'll just pass through
  
  next();
});
