import { z } from 'zod';

/**
 * Transaction validation schemas
 * Validates all transaction-related request bodies and parameters
 */

// ObjectId validation regex
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Create transaction schema
 */
export const CreateTransactionSchema = z.object({
  body: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title cannot exceed 200 characters')
      .trim(),
    amount: z.number()
      .positive('Amount must be positive')
      .max(999999999.99, 'Amount is too large'),
    type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER'], {
      errorMap: () => ({ message: 'Transaction type must be EXPENSE, INCOME, or TRANSFER' })
    }),
    categoryId: z.string()
      .regex(objectIdRegex, 'Invalid category ID format'),
    accountId: z.string()
      .regex(objectIdRegex, 'Invalid account ID format'),
    toAccountId: z.string()
      .regex(objectIdRegex, 'Invalid destination account ID format')
      .optional(),
    date: z.string()
      .datetime('Invalid date format')
      .transform(val => new Date(val)),
    notes: z.string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .trim()
      .optional(),
    tags: z.array(z.string()
      .max(30, 'Tag cannot exceed 30 characters')
      .trim())
      .max(20, 'Cannot have more than 20 tags')
      .optional(),
    paymentMethod: z.enum(['CASH', 'UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'CHEQUE', 'WALLET', 'EMI', 'OTHER'], {
      errorMap: () => ({ message: 'Invalid payment method' })
    })
      .optional(),
    isRecurring: z.boolean()
      .optional(),
    recurringType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], {
      errorMap: () => ({ message: 'Invalid recurring type' })
    })
      .optional(),
    recurringEndDate: z.string()
      .datetime('Invalid recurring end date format')
      .transform(val => new Date(val))
      .optional(),
    receiptUrl: z.string()
      .url('Invalid receipt URL format')
      .max(500, 'Receipt URL cannot exceed 500 characters')
      .optional(),
    latitude: z.number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90')
      .optional(),
    longitude: z.number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180')
      .optional(),
    merchantName: z.string()
      .max(100, 'Merchant name cannot exceed 100 characters')
      .trim()
      .optional(),
    splitGroupId: z.string()
      .regex(objectIdRegex, 'Invalid split group ID format')
      .optional(),
    profileId: z.string()
      .regex(objectIdRegex, 'Invalid profile ID format')
      .optional()
  }).strict()
});

/**
 * Update transaction schema
 */
export const UpdateTransactionSchema = z.object({
  body: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title cannot exceed 200 characters')
      .trim()
      .optional(),
    amount: z.number()
      .positive('Amount must be positive')
      .max(999999999.99, 'Amount is too large')
      .optional(),
    type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER'], {
      errorMap: () => ({ message: 'Transaction type must be EXPENSE, INCOME, or TRANSFER' })
    })
      .optional(),
    categoryId: z.string()
      .regex(objectIdRegex, 'Invalid category ID format')
      .optional(),
    accountId: z.string()
      .regex(objectIdRegex, 'Invalid account ID format')
      .optional(),
    toAccountId: z.string()
      .regex(objectIdRegex, 'Invalid destination account ID format')
      .optional(),
    date: z.string()
      .datetime('Invalid date format')
      .transform(val => new Date(val))
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
    paymentMethod: z.enum(['CASH', 'UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'CHEQUE', 'WALLET', 'EMI', 'OTHER'], {
      errorMap: () => ({ message: 'Invalid payment method' })
    })
      .optional(),
    isRecurring: z.boolean()
      .optional(),
    recurringType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], {
      errorMap: () => ({ message: 'Invalid recurring type' })
    })
      .optional(),
    recurringEndDate: z.string()
      .datetime('Invalid recurring end date format')
      .transform(val => new Date(val))
      .optional(),
    receiptUrl: z.string()
      .url('Invalid receipt URL format')
      .max(500, 'Receipt URL cannot exceed 500 characters')
      .optional(),
    latitude: z.number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90')
      .optional(),
    longitude: z.number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180')
      .optional(),
    merchantName: z.string()
      .max(100, 'Merchant name cannot exceed 100 characters')
      .trim()
      .optional(),
    splitGroupId: z.string()
      .regex(objectIdRegex, 'Invalid split group ID format')
      .optional(),
    profileId: z.string()
      .regex(objectIdRegex, 'Invalid profile ID format')
      .optional()
  }).strict()
});

/**
 * Transaction ID parameter schema
 */
export const TransactionIdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(objectIdRegex, 'Invalid transaction ID format')
  })
});

/**
 * Transaction query schema
 */
export const TransactionQuerySchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .transform(Number)
      .optional(),
    limit: z.string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .transform(Number)
      .optional(),
    from: z.string()
      .datetime('Invalid from date format')
      .transform(val => new Date(val))
      .optional(),
    to: z.string()
      .datetime('Invalid to date format')
      .transform(val => new Date(val))
      .optional(),
    type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER'])
      .optional(),
    categoryId: z.string()
      .regex(objectIdRegex, 'Invalid category ID format')
      .optional(),
    accountId: z.string()
      .regex(objectIdRegex, 'Invalid account ID format')
      .optional(),
    tags: z.string()
      .optional(), // Will be split by commas in controller
    q: z.string()
      .max(100, 'Search query cannot exceed 100 characters')
      .trim()
      .optional(),
    minAmount: z.string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid minimum amount format')
      .transform(Number)
      .optional(),
    maxAmount: z.string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid maximum amount format')
      .transform(Number)
      .optional(),
    isRecurring: z.string()
      .regex(/^(true|false)$/, 'isRecurring must be true or false')
      .transform(val => val === 'true')
      .optional(),
    sortBy: z.enum(['date', 'amount', 'title', 'createdAt'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc'])
      .optional(),
    paymentMethod: z.enum(['CASH', 'UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'CHEQUE', 'WALLET', 'EMI', 'OTHER'])
      .optional()
  })
});

/**
 * Bulk delete transactions schema
 */
export const BulkDeleteTransactionsSchema = z.object({
  body: z.object({
    ids: z.array(z.string()
      .regex(objectIdRegex, 'Invalid transaction ID format'))
      .min(1, 'At least one transaction ID is required')
      .max(100, 'Cannot delete more than 100 transactions at once')
  }).strict()
});

/**
 * Import transactions schema
 */
export const ImportTransactionsSchema = z.object({
  body: z.object({
    dateCol: z.string()
      .min(1, 'Date column name is required')
      .max(50, 'Date column name cannot exceed 50 characters'),
    amountCol: z.string()
      .min(1, 'Amount column name is required')
      .max(50, 'Amount column name cannot exceed 50 characters'),
    titleCol: z.string()
      .min(1, 'Title column name is required')
      .max(50, 'Title column name cannot exceed 50 characters'),
    categoryCol: z.string()
      .max(50, 'Category column name cannot exceed 50 characters')
      .optional(),
    typeCol: z.string()
      .max(50, 'Type column name cannot exceed 50 characters')
      .optional(),
    notesCol: z.string()
      .max(50, 'Notes column name cannot exceed 50 characters')
      .optional(),
    dateFormat: z.string()
      .min(1, 'Date format is required')
      .max(20, 'Date format cannot exceed 20 characters')
  }).strict()
});

/**
 * Search merchants schema
 */
export const SearchMerchantsSchema = z.object({
  query: z.object({
    q: z.string()
      .min(1, 'Search query is required')
      .max(100, 'Search query cannot exceed 100 characters')
      .trim(),
    limit: z.string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .transform(Number)
      .optional()
  })
});

/**
 * Account transfer schema
 */
export const AccountTransferSchema = z.object({
  body: z.object({
    toAccountId: z.string()
      .regex(objectIdRegex, 'Invalid destination account ID format'),
    amount: z.number()
      .positive('Transfer amount must be positive')
      .max(999999999.99, 'Transfer amount is too large'),
    date: z.string()
      .datetime('Invalid date format')
      .transform(val => new Date(val))
      .optional(),
    notes: z.string()
      .max(1000, 'Notes cannot exceed 1000 characters')
      .trim()
      .optional()
  }).strict()
});

/**
 * Account ID parameter schema
 */
export const AccountIdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(objectIdRegex, 'Invalid account ID format')
  })
});

/**
 * Transaction comment schema
 */
export const CreateCommentSchema = z.object({
  body: z.object({
    text: z.string()
      .min(1, 'Comment text is required')
      .max(500, 'Comment cannot exceed 500 characters')
      .trim(),
    profileId: z.string()
      .regex(objectIdRegex, 'Invalid profile ID format')
      .optional()
  }).strict()
});

/**
 * Comment ID parameter schema
 */
export const CommentIdParamSchema = z.object({
  params: z.object({
    transactionId: z.string()
      .regex(objectIdRegex, 'Invalid transaction ID format'),
    commentId: z.string()
      .regex(objectIdRegex, 'Invalid comment ID format')
  })
});

/**
 * Combined schemas for validation middleware
 */
export const CreateTransactionValidation = CreateTransactionSchema;
export const UpdateTransactionValidation = UpdateTransactionSchema;
export const TransactionIdValidation = TransactionIdParamSchema;
export const TransactionQueryValidation = TransactionQuerySchema;
export const BulkDeleteTransactionsValidation = BulkDeleteTransactionsSchema;
export const ImportTransactionsValidation = ImportTransactionsSchema;
export const SearchMerchantsValidation = SearchMerchantsSchema;
export const AccountTransferValidation = AccountTransferSchema;
export const AccountIdValidation = AccountIdParamSchema;
export const CreateCommentValidation = CreateCommentSchema;
export const CommentIdValidation = CommentIdParamSchema;
