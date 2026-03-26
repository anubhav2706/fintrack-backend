import { z } from 'zod';

/**
 * Environment configuration validation using Zod
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  HOST: z.string().default('localhost'),
  API_PREFIX: z.string().default('/api/v1'),

  // MongoDB
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT access secret must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),

  // BCrypt
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),

  // Firebase FCM
  FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'Firebase private key is required'),
  FIREBASE_CLIENT_EMAIL: z.string().email('Firebase client email must be valid'),

  // Email (Nodemailer)
  SMTP_HOST: z.string().min(1, 'SMTP host is required'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_USER: z.string().min(1, 'SMTP user is required'),
  SMTP_PASS: z.string().min(1, 'SMTP password is required'),
  EMAIL_FROM: z.string().email('Email from address must be valid'),

  // File Upload
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('5'),
  UPLOAD_PATH: z.string().default('./uploads'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),

  // CORS
  ALLOWED_ORIGINS: z.string().min(1, 'Allowed origins are required'),
  CORS_ENABLED: z.string().transform(val => val === 'true').default('true'),

  // Encryption
  FIELD_ENCRYPTION_KEY: z.string().length(64, 'Field encryption key must be 32 hex characters (64 chars)'),

  // Additional JWT secrets (optional for development)
  JWT_EMAIL_VERIFY_SECRET: z.string().optional(),
  JWT_PASSWORD_RESET_SECRET: z.string().optional(),
  
  // Frontend URL (optional for development)
  FRONTEND_URL: z.string().url().optional(),
});

/**
 * Validate and export environment variables
 * Throws error if any required variable is missing or invalid
 */
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return {
      ...env,
      // Transform comma-separated origins to array
      ALLOWED_ORIGINS: env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Unexpected error during environment validation:', error);
    }
    process.exit(1);
  }
}

export const env = validateEnv();

// Simple logger for now - TODO: Implement proper winston logger
export const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
};
