import { Response } from 'express';

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Standardized API Response class
 * Ensures consistent response format across all endpoints
 */
export class ApiResponse<T> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data: T | null;
  public meta?: PaginationMeta;
  public errors?: any[];

  constructor(
    statusCode: number,
    data: T | null,
    message: string = 'Success',
    meta?: PaginationMeta,
    errors?: any[]
  ) {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.errors = errors;
  }

  /**
   * Send a successful response (200 OK)
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200,
    meta?: PaginationMeta
  ): Response {
    const response = new ApiResponse(statusCode, data, message, meta);
    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201 Created)
   */
  static created<T>(res: Response, data: T, message?: string): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  /**
   * Send an accepted response (202 Accepted)
   */
  static accepted<T>(res: Response, data: T, message?: string): Response {
    return ApiResponse.success(res, data, message, 202);
  }

  /**
   * Send a no content response (204 No Content)
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send a paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    message?: string
  ): Response {
    return ApiResponse.success(res, data, message, 200, meta);
  }

  /**
   * Send an error response
   */
  static error(
    res: Response,
    statusCode: number,
    message: string,
    errors?: any[]
  ): Response {
    const response = new ApiResponse(statusCode, null, message, undefined, errors);
    return res.status(statusCode).json(response);
  }

  /**
   * Send a bad request response (400)
   */
  static badRequest(res: Response, message: string, errors?: any[]): Response {
    return ApiResponse.error(res, 400, message, errors);
  }

  /**
   * Send an unauthorized response (401)
   */
  static unauthorized(res: Response, message?: string): Response {
    return ApiResponse.error(res, 401, message || 'Unauthorized');
  }

  /**
   * Send a forbidden response (403)
   */
  static forbidden(res: Response, message?: string): Response {
    return ApiResponse.error(res, 403, message || 'Forbidden');
  }

  /**
   * Send a not found response (404)
   */
  static notFound(res: Response, message?: string): Response {
    return ApiResponse.error(res, 404, message || 'Resource not found');
  }

  /**
   * Send a conflict response (409)
   */
  static conflict(res: Response, message: string, errors?: any[]): Response {
    return ApiResponse.error(res, 409, message, errors);
  }

  /**
   * Send an unprocessable entity response (422)
   */
  static unprocessableEntity(res: Response, message: string, errors?: any[]): Response {
    return ApiResponse.error(res, 422, message, errors);
  }

  /**
   * Send a too many requests response (429)
   */
  static tooManyRequests(res: Response, message?: string): Response {
    return ApiResponse.error(res, 429, message || 'Too many requests');
  }

  /**
   * Send an internal server error response (500)
   */
  static internal(res: Response, message?: string): Response {
    return ApiResponse.error(res, 500, message || 'Internal server error');
  }

  /**
   * Send a service unavailable response (503)
   */
  static serviceUnavailable(res: Response, message?: string): Response {
    return ApiResponse.error(res, 503, message || 'Service unavailable');
  }

  /**
   * Convert response to JSON
   */
  toJSON(): {
    success: boolean;
    statusCode: number;
    message: string;
    data: T | null;
    meta?: PaginationMeta;
    errors?: any[];
  } {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      meta: this.meta,
      errors: this.errors,
    };
  }
}
