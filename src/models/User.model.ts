import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUserDocument } from '../types';

/**
 * User Schema
 * Stores user authentication and preference data
 */
const userSchema = new Schema<IUserDocument>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
    minlength: [60, 'Password hash must be at least 60 characters']
  },
  passcode: {
    type: String,
    select: false,
    minlength: [60, 'Passcode hash must be at least 60 characters']
  },
  biometricEnabled: {
    type: Boolean,
    default: false
  },
  fcmToken: {
    type: String,
    select: false
  },
  avatarUrl: {
    type: String,
    maxlength: [500, 'Avatar URL cannot exceed 500 characters']
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
    maxlength: [3, 'Currency code must be 3 characters']
  },
  currencyPosition: {
    type: String,
    enum: ['before', 'after'],
    default: 'before'
  },
  numberFormat: {
    type: String,
    enum: ['indian', 'western'],
    default: 'indian'
  },
  weekStartsOn: {
    type: Number,
    default: 1, // Monday
    min: [0, 'Week start day must be between 0 (Sunday) and 6 (Saturday)'],
    max: [6, 'Week start day must be between 0 (Sunday) and 6 (Saturday)']
  },
  monthStartDate: {
    type: Number,
    default: 1,
    min: [1, 'Month start date must be between 1 and 28'],
    max: [28, 'Month start date must be between 1 and 28']
  },
  themePreference: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  notifBudget: {
    type: Boolean,
    default: true
  },
  notifWeekly: {
    type: Boolean,
    default: true
  },
  notifGoals: {
    type: Boolean,
    default: true
  },
  notifBills: {
    type: Boolean,
    default: true
  },
  budgetAlertPct: {
    type: Number,
    default: 80,
    min: [10, 'Budget alert percentage must be at least 10'],
    max: [100, 'Budget alert percentage cannot exceed 100']
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifyToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastSyncAt: {
    type: Date
  },
  onboardingDone: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any & { __v?: any; passwordHash?: any; passcode?: any; emailVerifyToken?: any; passwordResetToken?: any; passwordResetExpires?: any; _id?: any; id?: any }) {
      delete ret.__v;
      delete ret.passwordHash;
      delete ret.passcode;
      delete ret.emailVerifyToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    // Hash password with cost of 12
    if (!this.passwordHash) {
      return next(new Error('Password is required'));
    }
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to hash passcode
userSchema.pre('save', async function(next) {
  // Only hash the passcode if it has been modified (or is new)
  if (!this.isModified('passcode') || !this.passcode) {
    return next();
  }

  try {
    // Hash passcode with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.passcode = await bcrypt.hash(this.passcode, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Compare password method
 * @param candidatePassword - Plain text password to compare
 * @returns Promise<boolean> - True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    if (!this.passwordHash) {
      return false;
    }
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    throw error;
  }
};

/**
 * Compare passcode method
 * @param candidatePasscode - Plain text passcode to compare
 * @returns Promise<boolean> - True if passcodes match
 */
userSchema.methods.comparePasscode = async function(candidatePasscode: string): Promise<boolean> {
  try {
    if (!this.passcode) {
      return false;
    }
    return await bcrypt.compare(candidatePasscode, this.passcode);
  } catch (error) {
    throw error;
  }
};

/**
 * Static method to find user by email with password
 * @param email - User email
 * @returns Promise<IUserDocument | null>
 */
userSchema.statics.findByEmailWithPassword = function(email: string) {
  return this.findOne({ email }).select('+passwordHash');
};

/**
 * Static method to find user by email with passcode
 * @param email - User email
 * @returns Promise<IUserDocument | null>
 */
userSchema.statics.findByEmailWithPasscode = function(email: string) {
  return this.findOne({ email }).select('+passcode');
};

/**
 * Static method to find user for password reset
 * @param email - User email
 * @returns Promise<IUserDocument | null>
 */
userSchema.statics.findByEmailForReset = function(email: string) {
  return this.findOne({ 
    email, 
    passwordResetToken: { $exists: true, $ne: null },
    passwordResetExpires: { $gt: new Date() }
  }).select('+passwordResetToken +passwordResetExpires');
};

/**
 * Virtual for full user profile (with sensitive data)
 */
userSchema.virtual('fullProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
    currency: this.currency,
    currencyPosition: this.currencyPosition,
    numberFormat: this.numberFormat,
    weekStartsOn: this.weekStartsOn,
    monthStartDate: this.monthStartDate,
    themePreference: this.themePreference,
    notifBudget: this.notifBudget,
    notifWeekly: this.notifWeekly,
    notifGoals: this.notifGoals,
    notifBills: this.notifBills,
    budgetAlertPct: this.budgetAlertPct,
    isEmailVerified: this.isEmailVerified,
    biometricEnabled: this.biometricEnabled,
    lastSyncAt: this.lastSyncAt,
    onboardingDone: this.onboardingDone,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

/**
 * Ensure virtuals are included in JSON
 */
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export const User = mongoose.model<IUserDocument>('User', userSchema);
