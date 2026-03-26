import { z } from 'zod';

/**
 * Additional validation schemas
 * Contains schemas for accounts, categories, goals, budgets, and other entities
 */

// ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Account schemas
 */
export const CreateAccountSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Account name is required')
      .max(100, 'Account name cannot exceed 100 characters')
      .trim(),
    type: z.enum(['CASH', 'BANK', 'CREDIT', 'INVESTMENT', 'SAVINGS'], {
      errorMap: () => ({ message: 'Account type must be CASH, BANK, CREDIT, INVESTMENT, or SAVINGS' })
    }),
    balance: z.number()
      .min(0, 'Balance cannot be negative')
      .max(999999999999, 'Balance is too large')
      .optional(),
    currency: z.string()
      .length(3, 'Currency must be 3 characters')
      .optional(),
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
      .optional(),
    icon: z.string()
      .max(50, 'Icon name cannot exceed 50 characters')
      .optional(),
    isDefault: z.boolean()
      .optional(),
    includeInTotal: z.boolean()
      .optional(),
    note: z.string()
      .max(500, 'Note cannot exceed 500 characters')
      .trim()
      .optional()
  }).strict()
});

export const UpdateAccountSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Account name is required')
      .max(100, 'Account name cannot exceed 100 characters')
      .trim()
      .optional(),
    type: z.enum(['CASH', 'BANK', 'CREDIT', 'INVESTMENT', 'SAVINGS'])
      .optional(),
    balance: z.number()
      .min(0, 'Balance cannot be negative')
      .max(999999999999, 'Balance is too large')
      .optional(),
    currency: z.string()
      .length(3, 'Currency must be 3 characters')
      .optional(),
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
      .optional(),
    icon: z.string()
      .max(50, 'Icon name cannot exceed 50 characters')
      .optional(),
    isDefault: z.boolean()
      .optional(),
    includeInTotal: z.boolean()
      .optional(),
    note: z.string()
      .max(500, 'Note cannot exceed 500 characters')
      .trim()
      .optional()
  }).strict()
});

/**
 * Category schemas
 */
export const CreateCategorySchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Category name is required')
      .max(50, 'Category name cannot exceed 50 characters')
      .trim(),
    icon: z.string()
      .min(1, 'Category icon is required')
      .max(50, 'Icon name cannot exceed 50 characters'),
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
    type: z.enum(['EXPENSE', 'INCOME', 'BOTH'], {
      errorMap: () => ({ message: 'Category type must be EXPENSE, INCOME, or BOTH' })
    }),
    parentId: z.string()
      .regex(objectIdRegex, 'Invalid parent category ID format')
      .optional(),
    monthlyBudget: z.number()
      .min(0, 'Monthly budget cannot be negative')
      .optional()
  }).strict()
});

export const UpdateCategorySchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Category name is required')
      .max(50, 'Category name cannot exceed 50 characters')
      .trim()
      .optional(),
    icon: z.string()
      .min(1, 'Category icon is required')
      .max(50, 'Icon name cannot exceed 50 characters')
      .optional(),
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
      .optional(),
    type: z.enum(['EXPENSE', 'INCOME', 'BOTH'])
      .optional(),
    parentId: z.string()
      .regex(objectIdRegex, 'Invalid parent category ID format')
      .optional(),
    monthlyBudget: z.number()
      .min(0, 'Monthly budget cannot be negative')
      .optional()
  }).strict()
});

export const CategoryReorderSchema = z.object({
  body: z.object({
    orderedIds: z.array(z.string()
      .regex(objectIdRegex, 'Invalid category ID format'))
      .min(1, 'At least one category ID is required')
  }).strict()
});

/**
 * Goal schemas
 */
export const CreateGoalSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Goal name is required')
      .max(100, 'Goal name cannot exceed 100 characters')
      .trim(),
    targetAmount: z.number()
      .positive('Target amount must be positive')
      .max(999999999999, 'Target amount is too large'),
    currentSaved: z.number()
      .min(0, 'Current saved amount cannot be negative')
      .max(999999999999, 'Current saved amount is too large')
      .optional(),
    deadline: z.string()
      .datetime('Invalid deadline date format')
      .transform(val => new Date(val)),
    icon: z.string()
      .max(50, 'Icon name cannot exceed 50 characters')
      .optional(),
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
      .optional(),
    priority: z.number()
      .int('Priority must be an integer')
      .min(0, 'Priority cannot be negative')
      .max(10, 'Priority cannot exceed 10')
      .optional(),
    linkedAccountId: z.string()
      .regex(objectIdRegex, 'Invalid account ID format')
      .optional(),
    category: z.string()
      .max(50, 'Category cannot exceed 50 characters')
      .optional()
  }).strict()
});

export const UpdateGoalSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Goal name is required')
      .max(100, 'Goal name cannot exceed 100 characters')
      .trim()
      .optional(),
    targetAmount: z.number()
      .positive('Target amount must be positive')
      .max(999999999999, 'Target amount is too large')
      .optional(),
    currentSaved: z.number()
      .min(0, 'Current saved amount cannot be negative')
      .max(999999999999, 'Current saved amount is too large')
      .optional(),
    deadline: z.string()
      .datetime('Invalid deadline date format')
      .transform(val => new Date(val))
      .optional(),
    icon: z.string()
      .max(50, 'Icon name cannot exceed 50 characters')
      .optional(),
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
      .optional(),
    priority: z.number()
      .int('Priority must be an integer')
      .min(0, 'Priority cannot be negative')
      .max(10, 'Priority cannot exceed 10')
      .optional(),
    linkedAccountId: z.string()
      .regex(objectIdRegex, 'Invalid account ID format')
      .optional(),
    category: z.string()
      .max(50, 'Category cannot exceed 50 characters')
      .optional()
  }).strict()
});

export const GoalContributionSchema = z.object({
  body: z.object({
    amount: z.number()
      .positive('Contribution amount must be positive')
      .max(999999999999, 'Contribution amount is too large'),
    date: z.string()
      .datetime('Invalid date format')
      .transform(val => new Date(val)),
    note: z.string()
      .max(500, 'Note cannot exceed 500 characters')
      .trim()
      .optional()
  }).strict()
});

export const GoalProjectionSchema = z.object({
  query: z.object({
    extraMonthly: z.string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid extra monthly amount format')
      .transform(Number)
      .optional()
  })
});

/**
 * Budget schemas
 */
export const CreateBudgetSchema = z.object({
  body: z.object({
    categoryId: z.string()
      .regex(objectIdRegex, 'Invalid category ID format'),
    monthlyLimit: z.number()
      .positive('Monthly limit must be positive')
      .max(999999999999, 'Monthly limit is too large'),
    month: z.number()
      .int('Month must be an integer')
      .min(1, 'Month must be between 1 and 12')
      .max(12, 'Month must be between 1 and 12'),
    year: z.number()
      .int('Year must be an integer')
      .min(2020, 'Year must be 2020 or later')
      .max(2100, 'Year cannot exceed 2100'),
    rolloverEnabled: z.boolean()
      .optional(),
    alertThreshold: z.number()
      .min(10, 'Alert threshold must be at least 10')
      .max(100, 'Alert threshold cannot exceed 100')
      .optional()
  }).strict()
});

export const UpdateBudgetSchema = z.object({
  body: z.object({
    monthlyLimit: z.number()
      .positive('Monthly limit must be positive')
      .max(999999999999, 'Monthly limit is too large')
      .optional(),
    rolloverEnabled: z.boolean()
      .optional(),
    alertThreshold: z.number()
      .min(10, 'Alert threshold must be at least 10')
      .max(100, 'Alert threshold cannot exceed 100')
      .optional()
  }).strict()
});

/**
 * Debt schemas
 */
export const CreateDebtSchema = z.object({
  body: z.object({
    personName: z.string()
      .min(1, 'Person name is required')
      .max(100, 'Person name cannot exceed 100 characters')
      .trim(),
    amount: z.number()
      .positive('Amount must be positive')
      .max(999999999999, 'Amount is too large'),
    type: z.enum(['I_OWE', 'THEY_OWE'], {
      errorMap: () => ({ message: 'Debt type must be I_OWE or THEY_OWE' })
    }),
    dueDate: z.string()
      .datetime('Invalid due date format')
      .transform(val => new Date(val))
      .optional(),
    note: z.string()
      .max(500, 'Note cannot exceed 500 characters')
      .trim()
      .optional(),
    relatedTransactionId: z.string()
      .regex(objectIdRegex, 'Invalid transaction ID format')
      .optional()
  }).strict()
});

export const SettleDebtSchema = z.object({
  body: z.object({
    accountId: z.string()
      .regex(objectIdRegex, 'Invalid account ID format')
      .optional(),
    createTransaction: z.boolean()
      .optional()
  }).strict()
});

/**
 * Split schemas
 */
export const CreateSplitSchema = z.object({
  body: z.object({
    title: z.string()
      .min(1, 'Split title is required')
      .max(200, 'Split title cannot exceed 200 characters')
      .trim(),
    totalAmount: z.number()
      .positive('Total amount must be positive')
      .max(999999999999, 'Total amount is too large'),
    paidByAccountId: z.string()
      .regex(objectIdRegex, 'Invalid paid by account ID format'),
    date: z.string()
      .datetime('Invalid date format')
      .transform(val => new Date(val)),
    note: z.string()
      .max(500, 'Note cannot exceed 500 characters')
      .trim()
      .optional(),
    members: z.array(z.object({
      name: z.string()
        .min(1, 'Member name is required')
        .max(100, 'Member name cannot exceed 100 characters')
        .trim(),
      shareAmount: z.number()
        .positive('Share amount must be positive')
        .max(999999999999, 'Share amount is too large')
    }))
      .min(2, 'At least 2 members are required')
      .max(20, 'Cannot have more than 20 members')
  }).strict()
});

export const PaySplitMemberSchema = z.object({
  body: z.object({
    createDebt: z.boolean()
      .optional()
  }).strict()
});

/**
 * Investment schemas
 */
export const CreateInvestmentSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Investment name is required')
      .max(100, 'Investment name cannot exceed 100 characters')
      .trim(),
    type: z.enum(['STOCKS', 'MF', 'CRYPTO', 'FD', 'GOLD', 'PPF', 'NPS', 'OTHER'], {
      errorMap: () => ({ message: 'Invalid investment type' })
    }),
    buyPrice: z.number()
      .positive('Buy price must be positive')
      .max(999999999999, 'Buy price is too large'),
    currentPrice: z.number()
      .min(0, 'Current price cannot be negative')
      .max(999999999999, 'Current price is too large'),
    quantity: z.number()
      .positive('Quantity must be positive')
      .max(999999999999, 'Quantity is too large'),
    accountId: z.string()
      .regex(objectIdRegex, 'Invalid account ID format')
      .optional(),
    purchaseDate: z.string()
      .datetime('Invalid purchase date format')
      .transform(val => new Date(val)),
    notes: z.string()
      .max(500, 'Notes cannot exceed 500 characters')
      .trim()
      .optional()
  }).strict()
});

export const UpdateInvestmentPriceSchema = z.object({
  body: z.object({
    currentPrice: z.number()
      .min(0, 'Current price cannot be negative')
      .max(999999999999, 'Current price is too large')
  }).strict()
});

/**
 * Bill schemas
 */
export const CreateBillSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Bill name is required')
      .max(100, 'Bill name cannot exceed 100 characters')
      .trim(),
    amount: z.number()
      .positive('Amount must be positive')
      .max(999999999999, 'Amount is too large'),
    billingCycle: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'], {
      errorMap: () => ({ message: 'Invalid billing cycle' })
    }),
    nextDueDate: z.string()
      .datetime('Invalid next due date format')
      .transform(val => new Date(val)),
    categoryId: z.string()
      .regex(objectIdRegex, 'Invalid category ID format'),
    accountId: z.string()
      .regex(objectIdRegex, 'Invalid account ID format'),
    reminderDaysBefore: z.number()
      .int('Reminder days must be an integer')
      .min(0, 'Reminder days cannot be negative')
      .max(30, 'Reminder days cannot exceed 30')
      .optional(),
    logo: z.string()
      .max(200, 'Logo URL cannot exceed 200 characters')
      .optional(),
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
      .optional()
  }).strict()
});

export const PayBillSchema = z.object({
  body: z.object({
    date: z.string()
      .datetime('Invalid date format')
      .transform(val => new Date(val))
      .optional(),
    createTransaction: z.boolean()
      .optional()
  }).strict()
});

/**
 * Installment schemas
 */
export const CreateInstallmentSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Installment name is required')
      .max(100, 'Installment name cannot exceed 100 characters')
      .trim(),
    totalAmount: z.number()
      .positive('Total amount must be positive')
      .max(999999999999, 'Total amount is too large'),
    emiAmount: z.number()
      .positive('EMI amount must be positive')
      .max(999999999999, 'EMI amount is too large'),
    totalInstallments: z.number()
      .int('Total installments must be an integer')
      .min(1, 'Total installments must be at least 1')
      .max(360, 'Total installments cannot exceed 360'),
    startDate: z.string()
      .datetime('Invalid start date format')
      .transform(val => new Date(val)),
    accountId: z.string()
      .regex(objectIdRegex, 'Invalid account ID format'),
    categoryId: z.string()
      .regex(objectIdRegex, 'Invalid category ID format'),
    interestRate: z.number()
      .min(0, 'Interest rate cannot be negative')
      .max(100, 'Interest rate cannot exceed 100')
      .optional(),
    notes: z.string()
      .max(500, 'Notes cannot exceed 500 characters')
      .trim()
      .optional()
  }).strict()
});

export const PayInstallmentSchema = z.object({
  body: z.object({
    date: z.string()
      .datetime('Invalid date format')
      .transform(val => new Date(val))
      .optional(),
    notes: z.string()
      .max(500, 'Notes cannot exceed 500 characters')
      .trim()
      .optional()
  }).strict()
});

/**
 * Template schemas
 */
export const CreateTemplateSchema = z.object({
  body: z.object({
    title: z.string()
      .min(1, 'Template title is required')
      .max(200, 'Template title cannot exceed 200 characters')
      .trim(),
    amount: z.number()
      .positive('Amount must be positive')
      .max(999999999999, 'Amount is too large')
      .optional(),
    type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER'])
      .optional(),
    categoryId: z.string()
      .regex(objectIdRegex, 'Invalid category ID format')
      .optional(),
    accountId: z.string()
      .regex(objectIdRegex, 'Invalid account ID format')
      .optional(),
    notes: z.string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .trim()
      .optional(),
    tags: z.array(z.string()
      .max(30, 'Tag cannot exceed 30 characters')
      .trim())
      .max(20, 'Cannot have more than 20 tags')
      .optional(),
    paymentMethod: z.enum(['CASH', 'UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'CHEQUE', 'WALLET', 'EMI', 'OTHER'])
      .optional()
  }).strict()
});

/**
 * Profile schemas
 */
export const CreateProfileSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Profile name is required')
      .max(50, 'Profile name cannot exceed 50 characters')
      .trim(),
    avatarColor: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Avatar color must be a valid hex color')
  }).strict()
});

/**
 * Envelope schemas
 */
export const CreateEnvelopeSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Envelope name is required')
      .max(100, 'Envelope name cannot exceed 100 characters')
      .trim(),
    allocatedAmount: z.number()
      .positive('Allocated amount must be positive')
      .max(999999999999, 'Allocated amount is too large'),
    sourceAccountId: z.string()
      .regex(objectIdRegex, 'Invalid source account ID format'),
    linkedCategoryId: z.string()
      .regex(objectIdRegex, 'Invalid linked category ID format')
      .optional(),
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
      .optional(),
    icon: z.string()
      .max(50, 'Icon name cannot exceed 50 characters')
      .optional(),
    month: z.number()
      .int('Month must be an integer')
      .min(1, 'Month must be between 1 and 12')
      .max(12, 'Month must be between 1 and 12'),
    year: z.number()
      .int('Year must be an integer')
      .min(2020, 'Year must be 2020 or later')
      .max(2100, 'Year cannot exceed 2100')
  }).strict()
});

export const RefillAllEnvelopesSchema = z.object({
  body: z.object({
    month: z.number()
      .int('Month must be an integer')
      .min(1, 'Month must be between 1 and 12')
      .max(12, 'Month must be between 1 and 12'),
    year: z.number()
      .int('Year must be an integer')
      .min(2020, 'Year must be 2020 or later')
      .max(2100, 'Year cannot exceed 2100')
  }).strict()
});

/**
 * Tag schemas
 */
export const CreateTagSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Tag name is required')
      .max(30, 'Tag name cannot exceed 30 characters')
      .trim(),
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
      .optional()
  }).strict()
});

export const UpdateTagSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Tag name is required')
      .max(30, 'Tag name cannot exceed 30 characters')
      .trim()
      .optional(),
    color: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
      .optional()
  }).strict()
});

/**
 * Sync schemas
 */
export const SyncPullSchema = z.object({
  body: z.object({
    deviceId: z.string()
      .min(1, 'Device ID is required')
      .max(100, 'Device ID cannot exceed 100 characters'),
    lastSyncAt: z.string()
      .datetime('Invalid last sync date format')
      .transform(val => new Date(val)),
    collections: z.array(z.string()
      .max(50, 'Collection name cannot exceed 50 characters'))
      .optional()
  }).strict()
});

export const SyncPushSchema = z.object({
  body: z.object({
    deviceId: z.string()
      .min(1, 'Device ID is required')
      .max(100, 'Device ID cannot exceed 100 characters'),
    changes: z.record(z.array(z.any()))
  }).strict()
});

/**
 * Notification schemas
 */
export const TestNotificationSchema = z.object({
  body: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(100, 'Title cannot exceed 100 characters'),
    body: z.string()
      .min(1, 'Body is required')
      .max(500, 'Body cannot exceed 500 characters')
  }).strict()
});

export const NotificationSettingsSchema = z.object({
  body: z.object({
    notifBudget: z.boolean().optional(),
    notifWeekly: z.boolean().optional(),
    notifGoals: z.boolean().optional(),
    notifBills: z.boolean().optional(),
    budgetAlertPct: z.number()
      .min(10, 'Budget alert percentage must be at least 10')
      .max(100, 'Budget alert percentage cannot exceed 100')
      .optional()
  }).strict()
});

/**
 * Common parameter schemas
 */
export const IdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(objectIdRegex, 'Invalid ID format')
  })
});

export const MonthYearQuerySchema = z.object({
  query: z.object({
    month: z.string()
      .regex(/^\d{1,2}$/, 'Month must be a number')
      .transform(Number)
      .refine(val => val >= 1 && val <= 12, 'Month must be between 1 and 12')
      .optional(),
    year: z.string()
      .regex(/^\d{4}$/, 'Year must be a 4-digit number')
      .transform(Number)
      .refine(val => val >= 2020 && val <= 2100, 'Year must be between 2020 and 2100')
      .optional()
  })
});

export const PaginationQuerySchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .transform(Number)
      .optional(),
    limit: z.string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .transform(Number)
      .optional()
  })
});

/**
 * Combined schemas for validation middleware
 */
export const CreateAccountValidation = CreateAccountSchema;
export const UpdateAccountValidation = UpdateAccountSchema;
export const CreateCategoryValidation = CreateCategorySchema;
export const UpdateCategoryValidation = UpdateCategorySchema;
export const CategoryReorderValidation = CategoryReorderSchema;
export const CreateGoalValidation = CreateGoalSchema;
export const UpdateGoalValidation = UpdateGoalSchema;
export const GoalContributionValidation = GoalContributionSchema;
export const GoalProjectionValidation = GoalProjectionSchema;
export const CreateBudgetValidation = CreateBudgetSchema;
export const UpdateBudgetValidation = UpdateBudgetSchema;
export const CreateDebtValidation = CreateDebtSchema;
export const SettleDebtValidation = SettleDebtSchema;
export const CreateSplitValidation = CreateSplitSchema;
export const PaySplitMemberValidation = PaySplitMemberSchema;
export const CreateInvestmentValidation = CreateInvestmentSchema;
export const UpdateInvestmentPriceValidation = UpdateInvestmentPriceSchema;
export const CreateBillValidation = CreateBillSchema;
export const PayBillValidation = PayBillSchema;
export const CreateInstallmentValidation = CreateInstallmentSchema;
export const PayInstallmentValidation = PayInstallmentSchema;
export const CreateTemplateValidation = CreateTemplateSchema;
export const CreateProfileValidation = CreateProfileSchema;
export const CreateEnvelopeValidation = CreateEnvelopeSchema;
export const RefillAllEnvelopesValidation = RefillAllEnvelopesSchema;
export const CreateTagValidation = CreateTagSchema;
export const UpdateTagValidation = UpdateTagSchema;
export const SyncPullValidation = SyncPullSchema;
export const SyncPushValidation = SyncPushSchema;
export const TestNotificationValidation = TestNotificationSchema;
export const NotificationSettingsValidation = NotificationSettingsSchema;
export const IdParamValidation = IdParamSchema;
export const MonthYearQueryValidation = MonthYearQuerySchema;
export const PaginationQueryValidation = PaginationQuerySchema;
