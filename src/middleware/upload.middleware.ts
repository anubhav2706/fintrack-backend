import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

/**
 * File upload configurations
 */

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
ensureDirectoryExists(path.join(process.cwd(), 'uploads'));
ensureDirectoryExists(path.join(process.cwd(), 'uploads', 'receipts'));
ensureDirectoryExists(path.join(process.cwd(), 'uploads', 'avatars'));
ensureDirectoryExists(path.join(process.cwd(), 'uploads', 'imports'));
ensureDirectoryExists(path.join(process.cwd(), 'uploads', 'temp'));

/**
 * Storage configurations
 */

// General file storage
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'temp');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// Receipt image storage
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'receipts');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'receipt-' + uniqueSuffix + ext);
  },
});

// Avatar storage
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'avatars');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'unknown';
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + userId + '-' + Date.now() + ext);
  },
});

// Import file storage
const importStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'imports');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'import-' + userId + '-' + uniqueSuffix + ext);
  },
});

/**
 * File filters
 */

// Image file filter
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
  }
};

// Document file filter
const documentFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/json',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only document files (JSON, CSV, Excel, Text) are allowed'));
  }
};

// Receipt file filter (images only)
const receiptFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only receipt images (JPEG, PNG, WebP) are allowed'));
  }
};

/**
 * Multer configurations
 */

// General file upload
export const uploadGeneral = multer({
  storage: generalStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/json', 'text/csv', 'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest('Invalid file type'));
    }
  },
});

// Receipt upload
export const uploadReceipt = multer({
  storage: receiptStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1, // Single file
  },
  fileFilter: receiptFileFilter,
});

// Avatar upload
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1, // Single file
  },
  fileFilter: imageFileFilter,
});

// Import file upload
export const uploadImport = multer({
  storage: importStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1, // Single file
  },
  fileFilter: documentFileFilter,
});

/**
 * File upload middleware
 */

// Single file upload
export const uploadSingle = (fieldName: string, uploadConfig: multer.Multer) => {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadConfig.single(fieldName)(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          if (error.code === 'LIMIT_FILE_SIZE') {
            return next(ApiError.badRequest('File size too large'));
          } else if (error.code === 'LIMIT_FILE_COUNT') {
            return next(ApiError.badRequest('Too many files'));
          } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(ApiError.badRequest('Unexpected file field'));
          }
        }
        return next(error);
      }
      next();
    });
  };
};

// Multiple files upload
export const uploadMultiple = (fieldName: string, maxCount: number, uploadConfig: multer.Multer) => {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadConfig.array(fieldName, maxCount)(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          if (error.code === 'LIMIT_FILE_SIZE') {
            return next(ApiError.badRequest('File size too large'));
          } else if (error.code === 'LIMIT_FILE_COUNT') {
            return next(ApiError.badRequest(`Maximum ${maxCount} files allowed`));
          } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(ApiError.badRequest('Unexpected file field'));
          }
        }
        return next(error);
      }
      next();
    });
  };
};

/**
 * File validation middleware
 */

// Validate uploaded file
export const validateFile = (options: {
  required?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = 1
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      if (required) {
        return next(ApiError.badRequest('File is required'));
      }
      return next();
    }

    const fileArray = Array.isArray(files) ? files : [files];
    
    if (fileArray.length > maxFiles) {
      return next(ApiError.badRequest(`Maximum ${maxFiles} file(s) allowed`));
    }

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxSize) {
        return next(ApiError.badRequest(`File size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`));
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return next(ApiError.badRequest(`File type ${file.mimetype} is not allowed`));
      }
    }

    next();
  };
};

/**
 * File cleanup middleware
 */

// Clean up temporary files
export const cleanupTempFiles = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[];
  
  if (files) {
    const fileArray = Array.isArray(files) ? files : [files];
    
    // Schedule cleanup after response
    res.on('finish', () => {
      setTimeout(() => {
        fileArray.forEach(file => {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (error) {
            // Ignore cleanup errors
          }
        });
      }, 60000); // Clean up after 1 minute
    });
  }
  
  next();
};

/**
 * File serving middleware
 */

// Serve uploaded files
export const serveFile = (directory: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', directory, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath, (error) => {
        if (error) {
          next(ApiError.notFound('File not found'));
        }
      });
    } else {
      next(ApiError.notFound('File not found'));
    }
  };
};

/**
 * File processing middleware
 */

// Process uploaded images (resize, compress, etc.)
export const processImages = (options: {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 80
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as Express.Multer.File[];
    
    if (files) {
      const fileArray = Array.isArray(files) ? files : [files];
      
      for (const file of fileArray) {
        if (file.mimetype.startsWith('image/')) {
          // Here you would use sharp or similar to process images
          // For now, we'll just pass through
        }
      }
    }
    
    next();
  };
};

/**
 * File metadata middleware
 */

// Add file metadata to request
export const addFileMetadata = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[];
  
  if (files) {
    const fileArray = Array.isArray(files) ? files : [files];
    
    (req as any).fileMetadata = fileArray.map(file => ({
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date(),
    }));
  }
  
  next();
};

/**
 * File security middleware
 */

// Validate file content (not just extension)
export const validateFileContent = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[];
  
  if (files) {
    const fileArray = Array.isArray(files) ? files : [files];
    
    for (const file of fileArray) {
      // Read file signature to validate actual file type
      try {
        const buffer = fs.readFileSync(file.path);
        const signature = buffer.subarray(0, 4).toString('hex');
        
        // Basic validation for common file types
        const validSignatures = {
          'image/jpeg': ['ffd8ff'],
          'image/png': ['89504e47'],
          'image/webp': ['52494646'],
          'image/gif': ['47494638'],
        };
        
        if (file.mimetype in validSignatures) {
          const validSigs = validSignatures[file.mimetype as keyof typeof validSignatures];
          if (!validSigs.some(sig => signature.startsWith(sig))) {
            return next(ApiError.badRequest('Invalid file content'));
          }
        }
      } catch (error) {
        return next(ApiError.badRequest('Failed to validate file content'));
      }
    }
  }
  
  next();
};
