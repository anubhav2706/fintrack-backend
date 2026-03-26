/**
 * Middleware Index
 * Exports all middleware functions for easy importing
 */

// Authentication middleware
export * from './auth.middleware';

// Validation middleware
export * from './validate.middleware';

// Error handling middleware
export * from './error.middleware';

// Rate limiting middleware
export * from './rateLimit.middleware';

// File upload middleware
export * from './upload.middleware';

// Re-export commonly used middleware
export {
  protect,
  optionalAuth,
  verifyRefreshToken,
  requireEmailVerified,
  requireOnboarding,
  requireBiometric,
  checkResourceOwnership,
  validateDeviceSync,
} from './auth.middleware';

export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validatePagination,
  validateDateRange,
  validateObjectId,
  validateEmail,
  validatePassword,
  sanitizeStrings,
} from './validate.middleware';

export {
  errorHandler,
  notFound,
  asyncHandler,
  requestLogger,
  securityHeaders,
  corsMiddleware,
  requestTimeout,
  healthCheck,
} from './error.middleware';

export {
  generalRateLimit,
  authRateLimit,
  passwordResetRateLimit,
  fileUploadRateLimit,
  syncRateLimit,
  generalSlowDown,
  authSlowDown,
  userRateLimit,
  apiKeyRateLimit,
  dynamicRateLimit,
  createRateLimit,
  rateLimitBypass,
  rateLimitStatus,
} from './rateLimit.middleware';

export {
  uploadGeneral,
  uploadReceipt,
  uploadAvatar,
  uploadImport,
  uploadSingle,
  uploadMultiple,
  validateFile,
  cleanupTempFiles,
  serveFile,
  processImages,
  addFileMetadata,
  validateFileContent,
} from './upload.middleware';
