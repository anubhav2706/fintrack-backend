/**
 * Main types export file
 * Centralizes all TypeScript interfaces and types used throughout the application
 */

// Import all document interfaces from express.d.ts
import type {
  IBaseDocument,
  IUserDocument,
  IAccountDocument,
  ICategoryDocument,
  ITransactionDocument,
  IGoalDocument,
  IGoalContributionDocument,
  IBudgetDocument,
  IDebtDocument,
  ISplitDocument,
  IInvestmentDocument,
  IBillDocument,
  IInstallmentDocument,
  ITemplateDocument,
  IProfileDocument,
  IActivityLogDocument,
  ITagDocument,
  IEnvelopeDocument,
  ITransactionCommentDocument,
  IBudgetGroupDocument,
  IDeviceSyncDocument
} from './express.d.ts';

// Export all document interfaces
export type {
  IBaseDocument,
  IUserDocument,
  IAccountDocument,
  ICategoryDocument,
  ITransactionDocument,
  IGoalDocument,
  IGoalContributionDocument,
  IBudgetDocument,
  IDebtDocument,
  ISplitDocument,
  IInvestmentDocument,
  IBillDocument,
  IInstallmentDocument,
  ITemplateDocument,
  IProfileDocument,
  IActivityLogDocument,
  ITagDocument,
  IEnvelopeDocument,
  ITransactionCommentDocument,
  IBudgetGroupDocument,
  IDeviceSyncDocument
};

/**
 * API Response interfaces
 */
export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  meta?: PaginationMeta;
  errors?: any[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Database query interfaces
 */
export interface DatabaseQuery {
  page?: number;
  limit?: number;
  sort?: string;
  from?: string;
  to?: string;
  type?: string;
  categoryId?: string;
  accountId?: string;
  tags?: string;
  q?: string;
  minAmount?: number;
  maxAmount?: number;
  isRecurring?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  paymentMethod?: string;
  isSettled?: boolean;
  isActive?: boolean;
  upcoming?: number;
  profileId?: string;
  action?: string;
  entityType?: string;
  deviceId?: string;
  lastSyncAt?: string;
  collections?: string[];
}

/**
 * Authentication interfaces
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  currency?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface PasscodeData {
  passcode: string;
}

export interface ChangePasscodeData {
  currentPasscode: string;
  newPasscode: string;
}

/**
 * Transaction interfaces
 */
export interface CreateTransactionData {
  title: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  date: string;
  notes?: string;
  tags?: string[];
  paymentMethod?: string;
  isRecurring?: boolean;
  recurringType?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  recurringEndDate?: string;
  receiptUrl?: string;
  latitude?: number;
  longitude?: number;
  merchantName?: string;
  splitGroupId?: string;
  profileId?: string;
}

export interface UpdateTransactionData extends Partial<CreateTransactionData> {}

export interface TransactionImportData {
  file: Buffer;
  dateCol: string;
  amountCol: string;
  titleCol: string;
  categoryCol?: string;
  typeCol?: string;
  notesCol?: string;
  dateFormat: string;
}

/**
 * Account interfaces
 */
export interface CreateAccountData {
  name: string;
  type: 'CASH' | 'BANK' | 'CREDIT' | 'INVESTMENT' | 'SAVINGS';
  balance: number;
  currency?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
  includeInTotal?: boolean;
  note?: string;
}

export interface UpdateAccountData extends Partial<CreateAccountData> {}

export interface AccountTransferData {
  toAccountId: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface AccountForecast {
  days: number;
}

/**
 * Category interfaces
 */
export interface CreateCategoryData {
  name: string;
  icon: string;
  color: string;
  type: 'EXPENSE' | 'INCOME' | 'BOTH';
  parentId?: string;
  monthlyBudget?: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface CategoryReorderData {
  orderedIds: string[];
}

/**
 * Goal interfaces
 */
export interface CreateGoalData {
  name: string;
  targetAmount: number;
  currentSaved?: number;
  deadline: string;
  icon?: string;
  color?: string;
  priority?: number;
  linkedAccountId?: string;
  category?: string;
}

export interface UpdateGoalData extends Partial<CreateGoalData> {}

export interface GoalContributionData {
  amount: number;
  date: string;
  note?: string;
}

export interface GoalProjectionQuery {
  extraMonthly?: number;
}

/**
 * Budget interfaces
 */
export interface CreateBudgetData {
  categoryId: string;
  monthlyLimit: number;
  month: number;
  year: number;
  rolloverEnabled?: boolean;
  alertThreshold?: number;
}

export interface UpdateBudgetData extends Partial<CreateBudgetData> {}

export interface CreateBudgetGroupData {
  name: string;
  color?: string;
  monthlyLimit: number;
  month: number;
  year: number;
  categoryIds: string[];
  rolloverEnabled?: boolean;
}

export interface UpdateBudgetGroupData extends Partial<CreateBudgetGroupData> {}

/**
 * Debt interfaces
 */
export interface CreateDebtData {
  personName: string;
  amount: number;
  type: 'I_OWE' | 'THEY_OWE';
  dueDate?: string;
  note?: string;
  relatedTransactionId?: string;
}

export interface UpdateDebtData extends Partial<CreateDebtData> {}

export interface SettleDebtData {
  accountId?: string;
  createTransaction?: boolean;
}

/**
 * Split interfaces
 */
export interface CreateSplitData {
  title: string;
  totalAmount: number;
  paidByAccountId: string;
  date: string;
  note?: string;
  members: Array<{
    name: string;
    shareAmount: number;
  }>;
}

export interface UpdateSplitData extends Partial<CreateSplitData> {}

export interface PaySplitMemberData {
  createDebt?: boolean;
}

/**
 * Investment interfaces
 */
export interface CreateInvestmentData {
  name: string;
  type: 'STOCKS' | 'MF' | 'CRYPTO' | 'FD' | 'GOLD' | 'PPF' | 'NPS' | 'OTHER';
  buyPrice: number;
  currentPrice: number;
  quantity: number;
  accountId?: string;
  purchaseDate: string;
  notes?: string;
}

export interface UpdateInvestmentData extends Partial<CreateInvestmentData> {}

export interface UpdateInvestmentPriceData {
  currentPrice: number;
}

/**
 * Bill interfaces
 */
export interface CreateBillData {
  name: string;
  amount: number;
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  nextDueDate: string;
  categoryId: string;
  accountId: string;
  reminderDaysBefore?: number;
  logo?: string;
  color?: string;
}

export interface UpdateBillData extends Partial<CreateBillData> {}

export interface PayBillData {
  date?: string;
  createTransaction?: boolean;
}

/**
 * Installment interfaces
 */
export interface CreateInstallmentData {
  name: string;
  totalAmount: number;
  emiAmount: number;
  totalInstallments: number;
  startDate: string;
  accountId: string;
  categoryId: string;
  interestRate?: number;
  notes?: string;
}

export interface UpdateInstallmentData extends Partial<CreateInstallmentData> {}

export interface PayInstallmentData {
  date?: string;
  notes?: string;
}

/**
 * Template interfaces
 */
export interface CreateTemplateData {
  title: string;
  amount?: number;
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  categoryId?: string;
  accountId?: string;
  notes?: string;
  tags?: string[];
  paymentMethod?: string;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

/**
 * Profile interfaces
 */
export interface CreateProfileData {
  name: string;
  avatarColor: string;
}

export interface UpdateProfileData extends Partial<CreateProfileData> {}

/**
 * Envelope interfaces
 */
export interface CreateEnvelopeData {
  name: string;
  allocatedAmount: number;
  sourceAccountId: string;
  linkedCategoryId?: string;
  color?: string;
  icon?: string;
  month: number;
  year: number;
}

export interface UpdateEnvelopeData extends Partial<CreateEnvelopeData> {}

export interface RefillAllEnvelopesData {
  month: number;
  year: number;
}

/**
 * Tag interfaces
 */
export interface CreateTagData {
  name: string;
  color?: string;
}

export interface UpdateTagData {
  name?: string;
  color?: string;
}

/**
 * Comment interfaces
 */
export interface CreateCommentData {
  text: string;
  profileId?: string;
}

/**
 * Sync interfaces
 */
export interface SyncPullData {
  deviceId: string;
  lastSyncAt: string;
  collections?: string[];
}

export interface SyncPushData {
  deviceId: string;
  changes: {
    [collection: string]: {
      created?: any[];
      updated?: any[];
      deleted?: string[];
    };
  };
}

export interface SyncResponse {
  data: {
    [collection: string]: any[];
  };
  deletedIds: {
    [collection: string]: string[];
  };
  serverTime: string;
  syncVersion: number;
}

export interface SyncStatusResponse {
  [collection: string]: {
    lastModified: string;
    count: number;
  };
}

/**
 * Notification interfaces
 */
export interface TestNotificationData {
  title: string;
  body: string;
}

export interface NotificationSettingsData {
  notifBudget?: boolean;
  notifWeekly?: boolean;
  notifGoals?: boolean;
  notifBills?: boolean;
  budgetAlertPct?: number;
}

export interface FcmTokenData {
  fcmToken: string;
}

/**
 * File upload interfaces
 */
export interface FileUploadData {
  filename: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Analytics interfaces
 */
export interface AnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  avgDailySpend: number;
  previousPeriod: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
  };
  deltas: {
    income: { value: number; percent: number; direction: 'up' | 'down' | 'same' };
    expense: { value: number; percent: number; direction: 'up' | 'down' | 'same' };
    savings: { value: number; percent: number; direction: 'up' | 'down' | 'same' };
  };
}

export interface MonthlyAnalytics {
  month: number;
  year: number;
  income: number;
  expense: number;
  savings: number;
}

export interface WeeklyAnalytics {
  day: number; // 0=Sunday, 1=Monday, etc.
  avgAmount: number;
  totalAmount: number;
  count: number;
}

export interface CategoryAnalytics {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  count: number;
  percentage: number;
  previousAmount: number;
  delta: { value: number; percent: number; direction: 'up' | 'down' | 'same' };
}

export interface HeatmapData {
  date: string;
  amount: number;
  count: number;
}

export interface CashflowData {
  openingBalance: number;
  income: Array<{ category: string; amount: number }>;
  expense: Array<{ category: string; amount: number }>;
  closingBalance: number;
}

export interface TrendData {
  period: string;
  income: number;
  expense: number;
  savings: number;
}

export interface MerchantAnalytics {
  merchantName: string;
  totalSpent: number;
  count: number;
  avgAmount: number;
}

export interface PaymentMethodAnalytics {
  paymentMethod: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface FinancialScore {
  score: string;
  savingsRate: number;
  budgetAdherence: number;
  goalProgress: number;
  trend: 'up' | 'down' | 'same';
  prevScore: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface NetWorthData {
  assets: number;
  liabilities: number;
  netWorth: number;
  history: Array<{ month: string; netWorth: number }>;
}

/**
 * Error interfaces
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: ValidationError[];
  stack?: string; // Only in development
}

/**
 * Health check interfaces
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  uptime: number;
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    firebase: 'connected' | 'disconnected';
  };
}

/**
 * Default categories for new users
 */
export interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
  type: 'EXPENSE' | 'INCOME' | 'BOTH';
  sortOrder: number;
}

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
  currency: string;
  position: 'before' | 'after';
  format: 'indian' | 'western';
  symbol?: string;
}

/**
 * Date range interface
 */
export interface DateRange {
  from: string;
  to: string;
}

/**
 * Export all utility types
 */
export type {
  // Re-export from utils
  PaginationOptions,
  PaginatedResult,
} from '../utils/paginate';

export type {
  GoalPrediction,
  GoalTip,
  GoalProjection,
  TransactionSummary,
} from '../utils/goalPredictor';
