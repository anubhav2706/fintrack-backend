import { Request } from 'express';
import { Document, Types } from 'mongoose';

/**
 * Extend Express Request interface to include authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      validated?: {
        body?: any;
        query?: any;
        params?: any;
      };
    }
  }
}

/**
 * Base document interface with common fields
 */
export interface IBaseDocument extends Document {
  _id: Types.ObjectId;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  toJSON(): any;
}

/**
 * User document interface
 */
export interface IUserDocument extends IBaseDocument {
  name: string;
  email: string;
  passwordHash?: string;
  passcode?: string;
  biometricEnabled: boolean;
  fcmToken?: string;
  avatarUrl?: string;
  currency: string;
  currencyPosition: 'before' | 'after';
  numberFormat: 'indian' | 'western';
  weekStartsOn: number; // 0=Sun, 1=Mon
  monthStartDate: number;
  themePreference: 'light' | 'dark' | 'system';
  notifBudget: boolean;
  notifWeekly: boolean;
  notifGoals: boolean;
  notifBills: boolean;
  budgetAlertPct: number;
  isEmailVerified: boolean;
  emailVerifyToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastSyncAt?: Date;
  onboardingDone: boolean;
  comparePassword(candidate: string): Promise<boolean>;
  comparePasscode(candidate: string): Promise<boolean>;
}

/**
 * Account document interface
 */
export interface IAccountDocument extends IBaseDocument {
  userId: Types.ObjectId;
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT' | 'INVESTMENT' | 'SAVINGS';
  balance: number;
  currency: string;
  exchangeRate: number;
  color: string;
  icon: string;
  isDefault: boolean;
  includeInTotal: boolean;
  safetyThreshold: number;
  isArchived: boolean;
  note?: string;
}

/**
 * Category document interface
 */
export interface ICategoryDocument extends IBaseDocument {
  userId: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  type: 'EXPENSE' | 'INCOME' | 'BOTH';
  parentId?: Types.ObjectId;
  isDefault: boolean;
  isArchived: boolean;
  sortOrder: number;
  monthlyBudget?: number;
}

/**
 * Transaction document interface
 */
export interface ITransactionDocument extends IBaseDocument {
  userId: Types.ObjectId;
  title: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  categoryId: Types.ObjectId;
  accountId: Types.ObjectId;
  toAccountId?: Types.ObjectId;
  date: Date;
  notes?: string;
  tags: string[];
  paymentMethod: 'CASH' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | 'CHEQUE' | 'WALLET' | 'EMI' | 'OTHER';
  isRecurring: boolean;
  recurringType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurringEndDate?: Date;
  parentRecurringId?: Types.ObjectId;
  receiptUrl?: string;
  latitude?: number;
  longitude?: number;
  merchantName?: string;
  splitGroupId?: Types.ObjectId;
  profileId?: Types.ObjectId;
  importBatchId?: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

/**
 * Goal document interface
 */
export interface IGoalDocument extends IBaseDocument {
  userId: Types.ObjectId;
  name: string;
  targetAmount: number;
  currentSaved: number;
  deadline: Date;
  icon: string;
  color: string;
  priority: number;
  isAchieved: boolean;
  achievedAt?: Date;
  linkedAccountId?: Types.ObjectId;
  category?: string;
  isArchived: boolean;
}

/**
 * GoalContribution document interface
 */
export interface IGoalContributionDocument extends IBaseDocument {
  userId: Types.ObjectId;
  goalId: Types.ObjectId;
  amount: number;
  date: Date;
  note?: string;
}

/**
 * Budget document interface
 */
export interface IBudgetDocument extends IBaseDocument {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  monthlyLimit: number;
  month: number;
  year: number;
  rolloverEnabled: boolean;
  rolloverAmount: number;
  alertThreshold: number;
  alertSentAt?: Date;
}

/**
 * Debt document interface
 */
export interface IDebtDocument extends IBaseDocument {
  userId: Types.ObjectId;
  personName: string;
  amount: number;
  type: 'I_OWE' | 'THEY_OWE';
  dueDate?: Date;
  isSettled: boolean;
  settledAt?: Date;
  note?: string;
  relatedTransactionId?: Types.ObjectId;
}

/**
 * Split document interface
 */
export interface ISplitDocument extends IBaseDocument {
  userId: Types.ObjectId;
  title: string;
  totalAmount: number;
  paidByAccountId: Types.ObjectId;
  date: Date;
  note?: string;
  members: Array<{
    name: string;
    shareAmount: number;
    isPaid: boolean;
    paidAt?: Date;
  }>;
}

/**
 * Investment document interface
 */
export interface IInvestmentDocument extends IBaseDocument {
  userId: Types.ObjectId;
  name: string;
  type: 'STOCKS' | 'MF' | 'CRYPTO' | 'FD' | 'GOLD' | 'PPF' | 'NPS' | 'OTHER';
  buyPrice: number;
  currentPrice: number;
  quantity: number;
  accountId?: Types.ObjectId;
  purchaseDate: Date;
  notes?: string;
  priceHistory: Array<{
    price: number;
    date: Date;
  }>;
  isArchived: boolean;
}

/**
 * Bill document interface
 */
export interface IBillDocument extends IBaseDocument {
  userId: Types.ObjectId;
  name: string;
  amount: number;
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  nextDueDate: Date;
  categoryId: Types.ObjectId;
  accountId: Types.ObjectId;
  reminderDaysBefore: number;
  isActive: boolean;
  logo?: string;
  color?: string;
  lastPaidAt?: Date;
  lastAlertSentAt?: Date;
}

/**
 * Installment document interface
 */
export interface IInstallmentDocument extends IBaseDocument {
  userId: Types.ObjectId;
  name: string;
  totalAmount: number;
  emiAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  startDate: Date;
  nextDueDate: Date;
  accountId: Types.ObjectId;
  categoryId: Types.ObjectId;
  interestRate?: number;
  notes?: string;
  isActive: boolean;
  lastAlertSentAt?: Date;
}

/**
 * Template document interface
 */
export interface ITemplateDocument extends IBaseDocument {
  userId: Types.ObjectId;
  title: string;
  amount?: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  categoryId?: Types.ObjectId;
  accountId?: Types.ObjectId;
  notes?: string;
  tags: string[];
  paymentMethod?: string;
  usageCount: number;
  lastUsedAt?: Date;
}

/**
 * Profile document interface
 */
export interface IProfileDocument extends IBaseDocument {
  userId: Types.ObjectId;
  name: string;
  avatarColor: string;
  isDefault: boolean;
}

/**
 * ActivityLog document interface
 */
export interface IActivityLogDocument extends IBaseDocument {
  userId: Types.ObjectId;
  action: string;
  entityId?: Types.ObjectId;
  entityType?: string;
  description: string;
  profileId?: Types.ObjectId;
  metadata?: any;
}

/**
 * Tag document interface
 */
export interface ITagDocument extends IBaseDocument {
  userId: Types.ObjectId;
  name: string;
  color: string;
}

/**
 * Envelope document interface
 */
export interface IEnvelopeDocument extends IBaseDocument {
  userId: Types.ObjectId;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  sourceAccountId: Types.ObjectId;
  linkedCategoryId?: Types.ObjectId;
  color?: string;
  icon?: string;
  month: number;
  year: number;
  isActive: boolean;
}

/**
 * TransactionComment document interface
 */
export interface ITransactionCommentDocument extends IBaseDocument {
  userId: Types.ObjectId;
  transactionId: Types.ObjectId;
  profileId?: Types.ObjectId;
  text: string;
}

/**
 * BudgetGroup document interface
 */
export interface IBudgetGroupDocument extends IBaseDocument {
  userId: Types.ObjectId;
  name: string;
  color?: string;
  monthlyLimit: number;
  month: number;
  year: number;
  categoryIds: Types.ObjectId[];
  rolloverEnabled: boolean;
}

/**
 * DeviceSync document interface
 */
export interface IDeviceSyncDocument extends IBaseDocument {
  userId: Types.ObjectId;
  deviceId: string;
  deviceName?: string;
  platform: string;
  lastSyncAt: Date;
  syncVersion: number;
}

/**
 * Currency position enum
 */
export type CurrencyPosition = 'before' | 'after';

/**
 * Number format enum
 */
export type NumberFormat = 'indian' | 'western';

/**
 * Theme preference enum
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Account type enum
 */
export type AccountType = 'CASH' | 'BANK' | 'CREDIT' | 'INVESTMENT' | 'SAVINGS';

/**
 * Transaction type enum
 */
export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

/**
 * Category type enum
 */
export type CategoryType = 'EXPENSE' | 'INCOME' | 'BOTH';

/**
 * Payment method enum
 */
export type PaymentMethod = 'CASH' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'NET_BANKING' | 'CHEQUE' | 'WALLET' | 'EMI' | 'OTHER';

/**
 * Recurring type enum
 */
export type RecurringType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * Debt type enum
 */
export type DebtType = 'I_OWE' | 'THEY_OWE';

/**
 * Investment type enum
 */
export type InvestmentType = 'STOCKS' | 'MF' | 'CRYPTO' | 'FD' | 'GOLD' | 'PPF' | 'NPS' | 'OTHER';

/**
 * Billing cycle enum
 */
export type BillingCycle = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

/**
 * Week start day enum
 */
export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun, 1=Mon, etc.

/**
 * Confidence level enum
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Impact level enum
 */
export type ImpactLevel = 'high' | 'medium' | 'low';

/**
 * Financial grade enum
 */
export type FinancialGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';

/**
 * Sort direction enum
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Platform enum
 */
export type Platform = 'android' | 'ios' | 'web';

/**
 * Export all types for easy importing
 */
export * from './index';
