import { z } from 'zod';

/**
 * Authentication validation schemas
 * Validates all authentication-related request bodies and parameters
 */

// ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * User registration schema
 */
export const RegisterSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: z.string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password cannot exceed 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    currency: z.string()
      .length(3, 'Currency must be 3 characters')
      .optional()
  }).strict()
});

/**
 * User login schema
 */
export const LoginSchema = z.object({
  body: z.object({
    email: z.string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(1, 'Password is required')
  }).strict()
});

/**
 * Token refresh schema
 */
export const RefreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string()
      .min(1, 'Refresh token is required')
  }).strict()
});

/**
 * Logout schema
 */
export const LogoutSchema = z.object({
  body: z.object({
    refreshToken: z.string()
      .min(1, 'Refresh token is required')
  }).strict()
});

/**
 * Forgot password schema
 */
export const ForgotPasswordSchema = z.object({
  body: z.object({
    email: z.string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .toLowerCase()
      .trim()
  }).strict()
});

/**
 * Reset password schema
 */
export const ResetPasswordSchema = z.object({
  body: z.object({
    email: z.string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    otp: z.string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d+$/, 'OTP must contain only digits'),
    newPassword: z.string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password cannot exceed 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one lowercase letter, one uppercase letter, and one number')
  }).strict()
});

/**
 * Setup passcode schema
 */
export const SetupPasscodeSchema = z.object({
  body: z.object({
    passcode: z.string()
      .length(4, 'Passcode must be exactly 4 digits')
      .regex(/^\d+$/, 'Passcode must contain only digits')
  }).strict()
});

/**
 * Verify passcode schema
 */
export const VerifyPasscodeSchema = z.object({
  body: z.object({
    passcode: z.string()
      .length(4, 'Passcode must be exactly 4 digits')
      .regex(/^\d+$/, 'Passcode must contain only digits')
  }).strict()
});

/**
 * Change passcode schema
 */
export const ChangePasscodeSchema = z.object({
  body: z.object({
    currentPasscode: z.string()
      .length(4, 'Current passcode must be exactly 4 digits')
      .regex(/^\d+$/, 'Current passcode must contain only digits'),
    newPasscode: z.string()
      .length(4, 'New passcode must be exactly 4 digits')
      .regex(/^\d+$/, 'New passcode must contain only digits')
  }).strict()
});

/**
 * Verify email schema
 */
export const VerifyEmailSchema = z.object({
  body: z.object({
    token: z.string()
      .min(1, 'Verification token is required')
  }).strict()
});

/**
 * Update user profile schema
 */
export const UpdateUserSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),
    currency: z.string()
      .length(3, 'Currency must be 3 characters')
      .optional(),
    currencyPosition: z.enum(['before', 'after'])
      .optional(),
    numberFormat: z.enum(['indian', 'western'])
      .optional(),
    weekStartsOn: z.number()
      .int('Week start day must be an integer')
      .min(0, 'Week start day must be between 0 (Sunday) and 6 (Saturday)')
      .max(6, 'Week start day must be between 0 (Sunday) and 6 (Saturday)')
      .optional(),
    monthStartDate: z.number()
      .int('Month start date must be an integer')
      .min(1, 'Month start date must be between 1 and 28')
      .max(28, 'Month start date must be between 1 and 28')
      .optional(),
    themePreference: z.enum(['light', 'dark', 'system'])
      .optional(),
    notifBudget: z.boolean()
      .optional(),
    notifWeekly: z.boolean()
      .optional(),
    notifGoals: z.boolean()
      .optional(),
    notifBills: z.boolean()
      .optional(),
    budgetAlertPct: z.number()
      .min(10, 'Budget alert percentage must be at least 10')
      .max(100, 'Budget alert percentage cannot exceed 100')
      .optional()
  }).strict()
});

/**
 * Update FCM token schema
 */
export const UpdateFcmTokenSchema = z.object({
  body: z.object({
    fcmToken: z.string()
      .min(1, 'FCM token is required')
      .max(500, 'FCM token cannot exceed 500 characters')
  }).strict()
});

/**
 * Parameter schemas
 */
export const UserIdParamSchema = z.object({
  params: z.object({
    userId: z.string()
      .regex(objectIdRegex, 'Invalid user ID format')
  })
});

/**
 * Query schemas for auth endpoints
 */
export const AuthQuerySchema = z.object({
  query: z.object({
    include: z.string()
      .optional()
  })
});

/**
 * Combined schemas for validation middleware
 */
export const CreateAuthSchema = RegisterSchema;
export const LoginAuthSchema = LoginSchema;
export const RefreshAuthSchema = RefreshTokenSchema;
export const LogoutAuthSchema = LogoutSchema;
export const ForgotPasswordAuthSchema = ForgotPasswordSchema;
export const ResetPasswordAuthSchema = ResetPasswordSchema;
export const SetupPasscodeAuthSchema = SetupPasscodeSchema;
export const VerifyPasscodeAuthSchema = VerifyPasscodeSchema;
export const ChangePasscodeAuthSchema = ChangePasscodeSchema;
export const VerifyEmailAuthSchema = VerifyEmailSchema;
export const UpdateUserAuthSchema = UpdateUserSchema;
export const UpdateFcmTokenAuthSchema = UpdateFcmTokenSchema;
