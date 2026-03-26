import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validation middleware factory
 * Creates middleware that validates request data using Zod schemas
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request data based on schema structure
      const validationResult = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!validationResult.success) {
        const zodError = validationResult.error;
        const errors = formatZodErrors(zodError);
        
        throw ApiError.unprocessableEntity('Validation failed', errors);
      }

      // Attach validated data to request
      req.validated = validationResult.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Format Zod errors into a more user-friendly format
 */
function formatZodErrors(zodError: ZodError): Array<{ field: string; message: string; code: string }> {
  return zodError.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }));
}

/**
 * Body-only validation middleware
 * Validates only the request body
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.body);

      if (!validationResult.success) {
        const zodError = validationResult.error;
        const errors = formatZodErrors(zodError);
        
        throw ApiError.unprocessableEntity('Body validation failed', errors);
      }

      req.validated = { ...req.validated, body: validationResult.data };
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Query-only validation middleware
 * Validates only the request query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.query);

      if (!validationResult.success) {
        const zodError = validationResult.error;
        const errors = formatZodErrors(zodError);
        
        throw ApiError.unprocessableEntity('Query validation failed', errors);
      }

      req.validated = { ...req.validated, query: validationResult.data };
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Params-only validation middleware
 * Validates only the request parameters
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.params);

      if (!validationResult.success) {
        const zodError = validationResult.error;
        const errors = formatZodErrors(zodError);
        
        throw ApiError.unprocessableEntity('Params validation failed', errors);
      }

      req.validated = { ...req.validated, params: validationResult.data };
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * File upload validation middleware
 * Validates uploaded files
 */
export const validateFile = (options: {
  required?: boolean;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/json', 'text/csv'],
    maxFiles = 1
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as any; // multer files
      
      if (!files || Object.keys(files).length === 0) {
        if (required) {
          throw ApiError.badRequest('File is required');
        }
        return next();
      }

      const fileArray = Array.isArray(files) ? files : [files];
      
      if (fileArray.length > maxFiles) {
        throw ApiError.badRequest(`Maximum ${maxFiles} file(s) allowed`);
      }

      for (const file of fileArray) {
        // Check file size
        if (file.size > maxSize) {
          throw ApiError.badRequest(`File size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`);
        }

        // Check file type
        if (!allowedTypes.includes(file.mimetype)) {
          throw ApiError.badRequest(`File type ${file.mimetype} is not allowed`);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Pagination validation middleware
 * Validates and sanitizes pagination parameters
 */
export const validatePagination = (defaultLimit = 20, maxLimit = 100) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string) || defaultLimit));
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

      req.validated = {
        ...req.validated,
        query: {
          ...req.validated?.query,
          page,
          limit,
          sortBy,
          sortOrder,
        }
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Date range validation middleware
 * Validates from/to date parameters
 */
export const validateDateRange = (required = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from, to } = req.query;
      
      let fromDate: Date | undefined;
      let toDate: Date | undefined;

      if (from) {
        fromDate = new Date(from as string);
        if (isNaN(fromDate.getTime())) {
          throw ApiError.badRequest('Invalid from date format');
        }
      } else if (required) {
        throw ApiError.badRequest('From date is required');
      }

      if (to) {
        toDate = new Date(to as string);
        if (isNaN(toDate.getTime())) {
          throw ApiError.badRequest('Invalid to date format');
        }
      } else if (required) {
        throw ApiError.badRequest('To date is required');
      }

      if (fromDate && toDate && fromDate > toDate) {
        throw ApiError.badRequest('From date must be before to date');
      }

      req.validated = {
        ...req.validated,
        query: {
          ...req.validated?.query,
          from: fromDate,
          to: toDate,
        }
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * MongoDB ObjectId validation middleware
 */
export const validateObjectId = (paramName = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params[paramName];
      
      if (!id) {
        throw ApiError.badRequest(`${paramName} is required`);
      }

      // MongoDB ObjectId regex pattern
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(id)) {
        throw ApiError.badRequest(`Invalid ${paramName} format`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Email validation middleware
 */
export const validateEmail = (field = 'email') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const email = req.body[field] || req.query[field];
      
      if (!email) {
        throw ApiError.badRequest(`${field} is required`);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw ApiError.badRequest(`Invalid ${field} format`);
      }

      // Normalize email
      if (req.body[field]) {
        req.body[field] = email.toLowerCase().trim();
      }
      if (req.query[field]) {
        req.query[field] = email.toLowerCase().trim();
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Password validation middleware
 */
export const validatePassword = (field = 'password') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const password = req.body[field];
      
      if (!password) {
        throw ApiError.badRequest(`${field} is required`);
      }

      if (password.length < 8) {
        throw ApiError.badRequest(`${field} must be at least 8 characters long`);
      }

      if (password.length > 128) {
        throw ApiError.badRequest(`${field} cannot exceed 128 characters`);
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        throw ApiError.badRequest(`${field} must contain at least one lowercase letter, one uppercase letter, and one number`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Sanitize string middleware
 * Trims whitespace and removes potentially harmful characters
 */
export const sanitizeStrings = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = req.body[field].trim().replace(/[<>]/g, '');
        }
        if (req.query[field] && typeof req.query[field] === 'string') {
          req.query[field] = req.query[field].trim().replace(/[<>]/g, '');
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
