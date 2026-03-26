import mongoose, { Schema, Document } from 'mongoose';

// Import all type interfaces
import { 
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
} from '../types';

/**
 * Investment Schema
 * Tracks investment holdings and performance
 */
const investmentSchema = new Schema<IInvestmentDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Investment name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['STOCKS', 'MF', 'CRYPTO', 'FD', 'GOLD', 'PPF', 'NPS', 'OTHER'],
      message: 'Investment type must be one of the allowed values'
    },
    required: [true, 'Investment type is required']
  },
  buyPrice: {
    type: Number,
    required: [true, 'Buy price is required'],
    min: [0.01, 'Buy price must be greater than 0']
  },
  currentPrice: {
    type: Number,
    required: [true, 'Current price is required'],
    min: [0, 'Current price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0.01, 'Quantity must be greater than 0']
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account'
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  priceHistory: [{
    price: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

investmentSchema.index({ userId: 1, isArchived: 1 });
investmentSchema.index({ userId: 1, type: 1 });

/**
 * Bill Schema
 * Tracks recurring bills and payments
 */
const billSchema = new Schema<IBillDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Bill name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  billingCycle: {
    type: String,
    enum: {
      values: ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
      message: 'Billing cycle must be one of: WEEKLY, MONTHLY, QUARTERLY, YEARLY'
    },
    required: [true, 'Billing cycle is required']
  },
  nextDueDate: {
    type: Date,
    required: [true, 'Next due date is required'],
    index: true
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Account ID is required']
  },
  reminderDaysBefore: {
    type: Number,
    default: 3,
    min: [0, 'Reminder days must be non-negative'],
    max: [30, 'Reminder days cannot exceed 30']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  logo: {
    type: String,
    maxlength: [200, 'Logo URL cannot exceed 200 characters']
  },
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  lastPaidAt: {
    type: Date
  },
  lastAlertSentAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

billSchema.index({ userId: 1, nextDueDate: 1 });
billSchema.index({ userId: 1, isActive: 1 });

/**
 * Installment Schema
 * Tracks EMI and installment payments
 */
const installmentSchema = new Schema<IInstallmentDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Installment name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0.01, 'Total amount must be greater than 0']
  },
  emiAmount: {
    type: Number,
    required: [true, 'EMI amount is required'],
    min: [0.01, 'EMI amount must be greater than 0']
  },
  totalInstallments: {
    type: Number,
    required: [true, 'Total installments is required'],
    min: [1, 'Total installments must be at least 1']
  },
  paidInstallments: {
    type: Number,
    default: 0,
    min: [0, 'Paid installments cannot be negative']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  nextDueDate: {
    type: Date,
    required: [true, 'Next due date is required']
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Account ID is required']
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
  },
  interestRate: {
    type: Number,
    min: [0, 'Interest rate cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastAlertSentAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

installmentSchema.index({ userId: 1, nextDueDate: 1 });
installmentSchema.index({ userId: 1, isActive: 1 });

/**
 * Template Schema
 * Stores transaction templates for quick entry
 */
const templateSchema = new Schema<ITemplateDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Template title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    min: [0, 'Amount cannot be negative']
  },
  type: {
    type: String,
    enum: {
      values: ['EXPENSE', 'INCOME', 'TRANSFER'],
      message: 'Transaction type must be one of: EXPENSE, INCOME, TRANSFER'
    }
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    trim: true
  },
  tags: [{
    type: String,
    maxlength: [30, 'Tag cannot exceed 30 characters'],
    trim: true
  }],
  paymentMethod: {
    type: String,
    enum: {
      values: ['CASH', 'UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'CHEQUE', 'WALLET', 'EMI', 'OTHER'],
      message: 'Payment method must be one of the allowed values'
    }
  },
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  lastUsedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

templateSchema.index({ userId: 1, usageCount: -1 });
templateSchema.index({ userId: 1, lastUsedAt: -1 });

/**
 * Profile Schema
 * Multi-profile support for family/shared accounts
 */
const profileSchema = new Schema<IProfileDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Profile name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  avatarColor: {
    type: String,
    required: [true, 'Avatar color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

profileSchema.index({ userId: 1, isDefault: 1 }, { unique: true });

/**
 * Activity Log Schema
 * Tracks user activities for audit and analytics
 */
const activityLogSchema = new Schema<IActivityLogDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    maxlength: [100, 'Action cannot exceed 100 characters']
  },
  entityId: {
    type: Schema.Types.ObjectId
  },
  entityType: {
    type: String,
    maxlength: [50, 'Entity type cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  profileId: {
    type: Schema.Types.ObjectId,
    ref: 'Profile'
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // TTL: 90 days

/**
 * Tag Schema
 * Custom tags for transactions
 */
const tagSchema = new Schema<ITagDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Tag name is required'],
    trim: true,
    maxlength: [30, 'Tag name cannot exceed 30 characters']
  },
  color: {
    type: String,
    default: '#888888',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

tagSchema.index({ userId: 1, name: 1 }, { unique: true });

/**
 * Envelope Schema
 * Envelope budgeting system
 */
const envelopeSchema = new Schema<IEnvelopeDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Envelope name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  allocatedAmount: {
    type: Number,
    required: [true, 'Allocated amount is required'],
    min: [0, 'Allocated amount cannot be negative']
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  sourceAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Source account ID is required']
  },
  linkedCategoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  icon: {
    type: String,
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

envelopeSchema.index({ userId: 1, month: 1, year: 1 });
envelopeSchema.index({ userId: 1, linkedCategoryId: 1 });

/**
 * Transaction Comment Schema
 * Comments on transactions
 */
const transactionCommentSchema = new Schema<ITransactionCommentDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  transactionId: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
    required: [true, 'Transaction ID is required'],
    index: true
  },
  profileId: {
    type: Schema.Types.ObjectId,
    ref: 'Profile'
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

transactionCommentSchema.index({ transactionId: 1, createdAt: -1 });

/**
 * Budget Group Schema
 * Groups budgets for better organization
 */
const budgetGroupSchema = new Schema<IBudgetGroupDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Budget group name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  monthlyLimit: {
    type: Number,
    required: [true, 'Monthly limit is required'],
    min: [0, 'Monthly limit cannot be negative']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later']
  },
  categoryIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  rolloverEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

budgetGroupSchema.index({ userId: 1, month: 1, year: 1 });

/**
 * Device Sync Schema
 * Tracks device synchronization status
 */
const deviceSyncSchema = new Schema<IDeviceSyncDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    maxlength: [100, 'Device ID cannot exceed 100 characters']
  },
  deviceName: {
    type: String,
    maxlength: [100, 'Device name cannot exceed 100 characters']
  },
  platform: {
    type: String,
    default: 'android',
    maxlength: [20, 'Platform cannot exceed 20 characters']
  },
  lastSyncAt: {
    type: Date,
    default: Date.now
  },
  syncVersion: {
    type: Number,
    default: 0,
    min: [0, 'Sync version cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

deviceSyncSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

// Export all models
export const Investment = mongoose.model<IInvestmentDocument>('Investment', investmentSchema);
export const Bill = mongoose.model<IBillDocument>('Bill', billSchema);
export const Installment = mongoose.model<IInstallmentDocument>('Installment', installmentSchema);
export const Template = mongoose.model<ITemplateDocument>('Template', templateSchema);
export const Profile = mongoose.model<IProfileDocument>('Profile', profileSchema);
export const ActivityLog = mongoose.model<IActivityLogDocument>('ActivityLog', activityLogSchema);
export const Tag = mongoose.model<ITagDocument>('Tag', tagSchema);
export const Envelope = mongoose.model<IEnvelopeDocument>('Envelope', envelopeSchema);
export const TransactionComment = mongoose.model<ITransactionCommentDocument>('TransactionComment', transactionCommentSchema);
export const BudgetGroup = mongoose.model<IBudgetGroupDocument>('BudgetGroup', budgetGroupSchema);
export const DeviceSync = mongoose.model<IDeviceSyncDocument>('DeviceSync', deviceSyncSchema);
