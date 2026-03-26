import { Request, Response, NextFunction } from 'express';

/**
 * Async error wrapper utility
 * Wraps async route handlers to automatically catch and forward errors to the error middleware
 * Eliminates the need for try-catch blocks in route handlers
 * 
 * @param fn - Async function to wrap
 * @returns Function that catches errors and passes them to next()
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Type for async request handler
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Higher-order function to create async handlers with automatic error catching
 * 
 * @example
 * ```typescript
 * const getUser = catchAsync(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   if (!user) {
 *     throw ApiError.notFound('User not found');
 *   }
 *   ApiResponse.success(res, user);
 * });
 * ```
 */
export function createAsyncHandler(
  handler: AsyncRequestHandler
): (req: Request, res: Response, next: NextFunction) => void {
  return catchAsync(handler);
}

/**
 * Utility to execute multiple async operations in parallel and handle errors
 * 
 * @param operations - Array of async operations to execute
 * @returns Promise that resolves with all results or rejects with first error
 */
export async function parallel<T>(
  ...operations: Promise<T>[]
): Promise<T[]> {
  return Promise.all(operations);
}

/**
 * Utility to execute async operations with timeout
 * 
 * @param promise - Promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message on timeout
 * @returns Promise with result or timeout error
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Utility to retry async operations
 * 
 * @param operation - Async operation to retry
 * @param maxRetries - Maximum number of retries
 * @param delayMs - Delay between retries in milliseconds
 * @returns Promise with result or last error
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError!;
}
