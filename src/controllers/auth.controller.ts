import { Request, Response } from 'express';
import { AuthService } from '../services';
import { catchAsync } from '../utils/catchAsync';

/**
 * Authentication Controller
 * Thin wrapper around AuthService methods
 */

export class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  static register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    res.status(result.statusCode).json(result);
  });

  /**
   * Login user
   * @route POST /api/auth/login
   */
  static login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    res.status(result.statusCode).json(result);
  });

  /**
   * Refresh access token
   * @route POST /api/auth/refresh
   */
  static refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    res.status(result.statusCode).json(result);
  });

  /**
   * Logout user
   * @route POST /api/auth/logout
   */
  static logout = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.logout(refreshToken);
    res.status(result.statusCode).json(result);
  });

  /**
   * Verify email
   * @route POST /api/auth/verify-email
   */
  static verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await AuthService.verifyEmail(token);
    res.status(result.statusCode).json(result);
  });

  /**
   * Forgot password
   * @route POST /api/auth/forgot-password
   */
  static forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await AuthService.forgotPassword(email);
    res.status(result.statusCode).json(result);
  });

  /**
   * Reset password
   * @route POST /api/auth/reset-password
   */
  static resetPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.resetPassword(req.body);
    res.status(result.statusCode).json(result);
  });

  /**
   * Setup passcode
   * @route POST /api/auth/setup-passcode
   */
  static setupPasscode = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { passcode } = req.body;
    const result = await AuthService.setupPasscode(userId, passcode);
    res.status(result.statusCode).json(result);
  });

  /**
   * Verify passcode
   * @route POST /api/auth/verify-passcode
   */
  static verifyPasscode = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { passcode } = req.body;
    const result = await AuthService.verifyPasscode(userId, passcode);
    res.status(result.statusCode).json(result);
  });

  /**
   * Change passcode
   * @route PUT /api/auth/change-passcode
   */
  static changePasscode = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await AuthService.changePasscode(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  /**
   * Change password
   * @route PUT /api/auth/change-password
   */
  static changePassword = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await AuthService.changePassword(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  /**
   * Update user profile
   * @route PUT /api/auth/profile
   */
  static updateProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await AuthService.updateProfile(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  /**
   * Update FCM token
   * @route PUT /api/auth/fcm-token
   */
  static updateFcmToken = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { fcmToken } = req.body;
    const result = await AuthService.updateFcmToken(userId, fcmToken);
    res.status(result.statusCode).json(result);
  });

  /**
   * Get user profile
   * @route GET /api/auth/profile
   */
  static getProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await AuthService.getProfile(userId);
    res.status(result.statusCode).json(result);
  });
}
