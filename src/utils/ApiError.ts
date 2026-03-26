/**
 * Custom Error class for API responses
 * Extends Error with additional properties for structured error handling
 */
export class ApiError extends Error {
  public statusCode: number;
  public errors?: any[];
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors?: any[],
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    
    // Ensure the stack trace points to where the error was created
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message: string, errors?: any[]): ApiError {
    return new ApiError(400, message, errors);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message: string, errors?: any[]): ApiError {
    return new ApiError(409, message, errors);
  }

  /**
   * Create a 422 Unprocessable Entity error
   */
  static unprocessableEntity(message: string, errors?: any[]): ApiError {
    return new ApiError(422, message, errors);
  }

  /**
   * Create a 429 Too Many Requests error
   */
  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message, undefined, false);
  }

  /**
   * Create a 503 Service Unavailable error
   */
  static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
    return new ApiError(503, message, undefined, false);
  }

  /**
   * Convert error to JSON format
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      errors: this.errors,
      isOperational: this.isOperational,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}
