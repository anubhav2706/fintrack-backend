import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { User } from '../models';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { logger } from '../config/env';

/**
 * Authentication Service
 * Handles all authentication-related business logic
 */

export class AuthService {
  /**
   * Generate JWT tokens for user
   */
  static generateTokens(userId: string): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { userId },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES } as any
    );

    const refreshToken = jwt.sign(
      { userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES } as any
    );

    return { accessToken, refreshToken };
  }

  /**
   * Register a new user
   */
  static register = async (userData: {
    name: string;
    email: string;
    password: string;
    currency?: string;
  }) => {
    const { name, email, password, currency = 'INR' } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      currency: currency.toUpperCase(),
      isEmailVerified: true,
      onboardingDone: true,
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    // Log activity
    logger.info('User registered', { userId: user.id, email: user.email });

    return {
      success: true,
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          isEmailVerified: user.isEmailVerified,
          onboardingDone: user.onboardingDone,
        },
        tokens,
      },
    };
  };

  /**
   * Login user
   */
  static login = async (credentials: {
    email: string;
    password: string;
  }) => {
    const { email, password } = credentials;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
    
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id);

    // Log activity
    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
      success: true,
      statusCode: 200,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          isEmailVerified: user.isEmailVerified,
          onboardingDone: user.onboardingDone,
        },
        tokens,
      },
    };
  };

  /**
   * Refresh access token
   */
  static refreshToken = async (refreshToken: string) => {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
      
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw ApiError.unauthorized('User not found');
      }

      const tokens = this.generateTokens(user.id);

      return {
        success: true,
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: tokens,
      };
    } catch (error) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
  };

  /**
   * Logout user
   */
  static logout = async (refreshToken: string) => {
    try {
      jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      return {
        success: true,
        statusCode: 200,
        message: 'Logout successful',
      };
    } catch (error) {
      // Even if token is invalid, return success for logout
      return {
        success: true,
        statusCode: 200,
        message: 'Logout successful',
      };
    }
  };

  /**
   * Get user profile
   */
  static getProfile = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          isEmailVerified: user.isEmailVerified,
          onboardingDone: user.onboardingDone,
        },
      },
    };
  };

  /**
   * Update user profile
   */
  static updateProfile = async (userId: string, updateData: any) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          isEmailVerified: user.isEmailVerified,
          onboardingDone: user.onboardingDone,
        },
      },
    };
  };

  /**
   * Setup passcode for user
   */
  static setupPasscode = async (userId: string, passcode: string) => {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await User.findByIdAndUpdate(userId, {
      $set: { passcode }
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Passcode setup successful',
    };
  };

  /**
   * Verify passcode
   */
  static verifyPasscode = async (userId: string, passcode: string) => {
    const user = await User.findById(userId).select('+passcode');
    if (!user || !user.passcode) {
      throw ApiError.unauthorized('Passcode not set');
    }

    const isPasscodeValid = await bcrypt.compare(passcode, user.passcode);
    if (!isPasscodeValid) {
      throw ApiError.unauthorized('Invalid passcode');
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Passcode verified successfully',
    };
  };

  /**
   * Change passcode
   */
  static changePasscode = async (userId: string, data: { currentPasscode: string; newPasscode: string }) => {
    const { currentPasscode, newPasscode } = data;
    
    const user = await User.findById(userId).select('+passcode');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.passcode) {
      const isCurrentPasscodeValid = await bcrypt.compare(currentPasscode, user.passcode);
      if (!isCurrentPasscodeValid) {
        throw ApiError.unauthorized('Invalid current passcode');
      }
    }

    await User.findByIdAndUpdate(userId, {
      $set: { passcode: newPasscode }
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Passcode changed successfully',
    };
  };

  /**
   * Change password
   */
  static changePassword = async (userId: string, data: { currentPassword: string; newPassword: string }) => {
    const { currentPassword, newPassword } = data;
    
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash || '');
    if (!isCurrentPasswordValid) {
      throw ApiError.unauthorized('Invalid current password');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    
    await User.findByIdAndUpdate(userId, {
      $set: { passwordHash: newPasswordHash }
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Password changed successfully',
    };
  };

  /**
   * Update FCM token
   */
  static updateFcmToken = async (userId: string, fcmToken: string) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { fcmToken } },
      { new: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return {
      success: true,
      statusCode: 200,
      message: 'FCM token updated successfully',
    };
  };

  /**
   * Verify email
   */
  static verifyEmail = async (token: string) => {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
      
      const user = await User.findByIdAndUpdate(
        decoded.userId,
        { $set: { isEmailVerified: true } },
        { new: true }
      );

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      return {
        success: true,
        statusCode: 200,
        message: 'Email verified successfully',
      };
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired verification token');
    }
  };

  /**
   * Forgot password
   */
  static forgotPassword = async (email: string) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not
      return {
        success: true,
        statusCode: 200,
        message: 'If an account with this email exists, a reset link has been sent',
      };
    }

    // Generate reset token (in a real app, you'd send this via email)
    const resetToken = jwt.sign(
      { userId: user.id },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    logger.info('Password reset requested', { userId: user.id, email: user.email });

    return {
      success: true,
      statusCode: 200,
      message: 'If an account with this email exists, a reset link has been sent',
      data: { resetToken }, // Only for development
    };
  };

  /**
   * Reset password
   */
  static resetPassword = async (data: { token: string; newPassword: string }) => {
    const { token, newPassword } = data;

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
      
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      
      await User.findByIdAndUpdate(decoded.userId, {
        $set: { passwordHash: newPasswordHash }
      });

      logger.info('Password reset successful', { userId: user.id });

      return {
        success: true,
        statusCode: 200,
        message: 'Password reset successful',
      };
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired reset token');
    }
  };
}
