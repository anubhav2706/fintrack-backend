/**
 * Schemas Index
 * Exports all Zod validation schemas for easy importing
 */

// Authentication schemas
export * from './auth.schema';

// Transaction schemas
export * from './transaction.schema';

// Additional schemas (accounts, categories, goals, etc.)
export * from './additional.schema';

// Re-export commonly used schemas for convenience
export {
  // Auth
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
  UserIdParamSchema
} from './auth.schema';

export {
  // Transactions
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionQuerySchema,
  BulkDeleteTransactionsSchema,
  ImportTransactionsSchema,
  SearchMerchantsSchema,
  AccountTransferSchema,
  CreateCommentSchema,
  TransactionIdParamSchema,
  AccountIdParamSchema,
  CommentIdParamSchema
} from './transaction.schema';

export {
  // Common
  IdParamSchema,
  MonthYearQuerySchema,
  PaginationQuerySchema
} from './additional.schema';

export {
  // Accounts & Categories
  CreateAccountSchema,
  UpdateAccountSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryReorderSchema,
  
  // Goals & Budgets
  CreateGoalSchema,
  UpdateGoalSchema,
  GoalContributionSchema,
  GoalProjectionSchema,
  CreateBudgetSchema,
  UpdateBudgetSchema,
  
  // Debts & Splits
  CreateDebtSchema,
  SettleDebtSchema,
  CreateSplitSchema,
  PaySplitMemberSchema,
  
  // Investments, Bills, Installments
  CreateInvestmentSchema,
  UpdateInvestmentPriceSchema,
  CreateBillSchema,
  PayBillSchema,
  CreateInstallmentSchema,
  PayInstallmentSchema,
  
  // Templates, Profiles, Envelopes, Tags
  CreateTemplateSchema,
  CreateProfileSchema,
  CreateEnvelopeSchema,
  RefillAllEnvelopesSchema,
  CreateTagSchema,
  UpdateTagSchema,
  
  // Sync & Notifications
  SyncPullSchema,
  SyncPushSchema,
  TestNotificationSchema,
  NotificationSettingsSchema
} from './additional.schema';
