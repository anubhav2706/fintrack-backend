import { Router } from 'express';
import { AuthController } from '../controllers';
import { validate, authRateLimit, passwordResetRateLimit, protect } from '../middleware';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  LogoutSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SetupPasscodeSchema,
  VerifyPasscodeSchema,
  ChangePasscodeSchema,
  VerifyEmailSchema,
  UpdateUserSchema,
  UpdateFcmTokenSchema,
} from '../schemas';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and account management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User's password
 *               currency:
 *                 type: string
 *                 length: 3
 *                 description: User's preferred currency (ISO code)
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post(
  '/register',
  authRateLimit,
  validate(RegisterSchema),
  AuthController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  authRateLimit,
  validate(LoginSchema),
  AuthController.login
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post(
  '/refresh',
  validate(RefreshTokenSchema),
  AuthController.refreshToken
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to invalidate
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post(
  '/logout',
  validate(LogoutSchema),
  AuthController.logout
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/verify-email',
  validate(VerifyEmailSchema),
  AuthController.verifyEmail
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post(
  '/forgot-password',
  passwordResetRateLimit,
  validate(ForgotPasswordSchema),
  AuthController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 length: 6
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid OTP or expired token
 */
router.post(
  '/reset-password',
  validate(ResetPasswordSchema),
  AuthController.resetPassword
);

/**
 * @swagger
 * /api/auth/setup-passcode:
 *   post:
 *     summary: Setup passcode for quick login
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - passcode
 *             properties:
 *               passcode:
 *                 type: string
 *                 length: 4
 *                 description: 4-digit passcode
 *     responses:
 *       200:
 *         description: Passcode setup successful
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/setup-passcode',
  protect,
  validate(SetupPasscodeSchema),
  AuthController.setupPasscode
);

/**
 * @swagger
 * /api/auth/verify-passcode:
 *   post:
 *     summary: Verify passcode for login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - passcode
 *             properties:
 *               passcode:
 *                 type: string
 *                 length: 4
 *     responses:
 *       200:
 *         description: Passcode verified successfully
 *       401:
 *         description: Invalid passcode
 */
router.post(
  '/verify-passcode',
  protect,
  authRateLimit,
  validate(VerifyPasscodeSchema),
  AuthController.verifyPasscode
);

/**
 * @swagger
 * /api/auth/change-passcode:
 *   put:
 *     summary: Change passcode
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPasscode
 *               - newPasscode
 *             properties:
 *               currentPasscode:
 *                 type: string
 *                 length: 4
 *               newPasscode:
 *                 type: string
 *                 length: 4
 *     responses:
 *       200:
 *         description: Passcode changed successfully
 *       401:
 *         description: Invalid current passcode
 */
router.put(
  '/change-passcode',
  protect,
  validate(ChangePasscodeSchema),
  AuthController.changePasscode
);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Invalid current password
 */
router.put(
  '/change-password',
  protect,
  validate(ChangePasscodeSchema), // Re-use the same schema structure
  AuthController.changePassword
);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               currency:
 *                 type: string
 *                 length: 3
 *               currencyPosition:
 *                 type: string
 *                 enum: [before, after]
 *               numberFormat:
 *                 type: string
 *                 enum: [indian, western]
 *               weekStartsOn:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 6
 *               monthStartDate:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 28
 *               themePreference:
 *                 type: string
 *                 enum: [light, dark, system]
 *               notifBudget:
 *                 type: boolean
 *               notifWeekly:
 *                 type: boolean
 *               notifGoals:
 *                 type: boolean
 *               notifBills:
 *                 type: boolean
 *               budgetAlertPct:
 *                 type: number
 *                 minimum: 10
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/profile',
  protect,
  validate(UpdateUserSchema),
  AuthController.updateProfile
);

/**
 * @swagger
 * /api/auth/fcm-token:
 *   put:
 *     summary: Update FCM token for push notifications
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: Firebase Cloud Messaging token
 *     responses:
 *       200:
 *         description: FCM token updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/fcm-token',
  protect,
  validate(UpdateFcmTokenSchema),
  AuthController.updateFcmToken
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/profile',
  protect,
  AuthController.getProfile
);

export default router;
