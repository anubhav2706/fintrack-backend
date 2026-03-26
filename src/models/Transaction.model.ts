import mongoose, { Schema, Document } from 'mongoose';
import { ITransactionDocument } from '../types';

/**
 * Transaction Schema
 * Stores all financial transactions for users
 */
const transactionSchema = new Schema<ITransactionDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Transaction title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  type: {
    type: String,
    enum: {
      values: ['EXPENSE', 'INCOME', 'TRANSFER'],
      message: 'Transaction type must be one of: EXPENSE, INCOME, TRANSFER'
    },
    required: [true, 'Transaction type is required']
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
  toAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account'
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    index: true
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
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringType: {
    type: String,
    enum: {
      values: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
      message: 'Recurring type must be one of: NONE, DAILY, WEEKLY, MONTHLY, YEARLY'
    },
    default: 'NONE'
  },
  recurringEndDate: {
    type: Date
  },
  parentRecurringId: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  receiptUrl: {
    type: String,
    maxlength: [500, 'Receipt URL cannot exceed 500 characters']
  },
  latitude: {
    type: Number,
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  longitude: {
    type: Number,
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },
  merchantName: {
    type: String,
    maxlength: [100, 'Merchant name cannot exceed 100 characters'],
    trim: true
  },
  splitGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'Split'
  },
  profileId: {
    type: Schema.Types.ObjectId,
    ref: 'Profile'
  },
  importBatchId: {
    type: String,
    maxlength: [50, 'Import batch ID cannot exceed 50 characters']
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
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

// Compound indexes for optimal query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index({ userId: 1, accountId: 1, date: -1 });
transactionSchema.index({ userId: 1, isDeleted: 1, date: -1 });
transactionSchema.index({ userId: 1, isRecurring: 1, recurringType: 1 });
transactionSchema.index({ userId: 1, tags: 1 });
transactionSchema.index({ userId: 1, merchantName: 'text', title: 'text', notes: 'text' });
transactionSchema.index({ userId: 1, splitGroupId: 1 });
transactionSchema.index({ userId: 1, importBatchId: 1 });
transactionSchema.index({ userId: 1, profileId: 1 });

// Pre-save middleware to validate transfer transactions
transactionSchema.pre('save', function(next) {
  if (this.type === 'TRANSFER' && !this.toAccountId) {
    const error = new Error('Transfer transactions must have a destination account');
    (error as any).statusCode = 400;
    return next(error);
  }
  
  if (this.type !== 'TRANSFER' && this.toAccountId) {
    this.toAccountId = undefined;
  }
  
  next();
});

/**
 * Static method to find user's active transactions
 * @param userId - User ID
 * @param options - Query options
 * @returns Promise<ITransactionDocument[]>
 */
transactionSchema.statics.findActiveByUser = function(userId: string, options: any = {}) {
  const {
    page = 1,
    limit = 20,
    from,
    to,
    type,
    categoryId,
    accountId,
    tags,
    search,
    minAmount,
    maxAmount,
    sortBy = 'date',
    sortOrder = 'desc'
  } = options;

  const query: any = {
    userId,
    isDeleted: false
  };

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  if (type) query.type = type;
  if (categoryId) query.categoryId = new mongoose.Types.ObjectId(categoryId);
  if (accountId) query.accountId = new mongoose.Types.ObjectId(accountId);
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',');
    query.tags = { $in: tagArray };
  }
  if (search) {
    query.$text = { $search: search };
  }
  if (minAmount || maxAmount) {
    query.amount = {};
    if (minAmount) query.amount.$gte = Number(minAmount);
    if (maxAmount) query.amount.$lte = Number(maxAmount);
  }

  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('categoryId', 'name icon color type')
    .populate('accountId', 'name type currency color icon')
    .populate('toAccountId', 'name type currency color icon')
    .populate('profileId', 'name avatarColor')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

/**
 * Static method to get transaction summary for a user
 * @param userId - User ID
 * @param from - Start date
 * @param to - End date
 * @param accountId - Optional account filter
 * @returns Promise<{ income: number; expense: number; net: number; count: number }>
 */
transactionSchema.statics.getSummary = function(userId: string, from: Date, to: Date, accountId?: string) {
  const match: any = {
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: from, $lte: to },
    isDeleted: false
  };

  if (accountId) {
    match.accountId = new mongoose.Types.ObjectId(accountId);
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        income: {
          $sum: {
            $cond: [{ $eq: ['$_id', 'INCOME'] }, '$total', 0]
          }
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ['$_id', 'EXPENSE'] }, '$total', 0]
          }
        },
        incomeCount: {
          $sum: {
            $cond: [{ $eq: ['$_id', 'INCOME'] }, '$count', 0]
          }
        },
        expenseCount: {
          $sum: {
            $cond: [{ $eq: ['$_id', 'EXPENSE'] }, '$count', 0]
          }
        }
      }
    },
    {
      $addFields: {
        net: { $subtract: ['$income', '$expense'] },
        count: { $add: ['$incomeCount', '$expenseCount'] }
      }
    },
    {
      $project: {
        _id: 0,
        income: 1,
        expense: 1,
        net: 1,
        count: 1
      }
    }
  ]);
};

/**
 * Static method to find recurring transactions
 * @param userId - User ID
 * @returns Promise<ITransactionDocument[]>
 */
transactionSchema.statics.findRecurring = function(userId: string) {
  return this.find({
    userId,
    isRecurring: true,
    recurringType: { $ne: 'NONE' },
    isDeleted: false
  }).populate('categoryId', 'name icon color')
   .populate('accountId', 'name type currency')
   .sort({ date: -1 });
};

/**
 * Static method to search transactions by merchant name
 * @param userId - User ID
 * @param query - Search query
 * @param limit - Result limit
 * @returns Promise<Array<{ merchantName: string; count: number }>>
 */
transactionSchema.statics.searchMerchants = function(userId: string, query: string, limit: number = 10) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        merchantName: { 
          $regex: query, 
          $options: 'i',
          $nin: [null, '']
        },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$merchantName',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        lastUsed: { $max: '$date' }
      }
    },
    {
      $project: {
        merchantName: '$_id',
        count: 1,
        totalAmount: 1,
        lastUsed: 1,
        _id: 0
      }
    },
    {
      $sort: { count: -1, lastUsed: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

/**
 * Static method to get monthly spending trend
 * @param userId - User ID
 * @param months - Number of months to analyze
 * @returns Promise<Array<{ month: string; income: number; expense: number; net: number }>>
 */
transactionSchema.statics.getMonthlyTrend = function(userId: string, months: number = 12) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: cutoffDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        income: {
          $sum: {
            $cond: [{ $eq: ['$type', 'INCOME'] }, '$amount', 0]
          }
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ['$type', 'EXPENSE'] }, '$amount', 0]
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $addFields: {
        month: {
          $dateToString: {
            format: '%Y-%m',
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month'
              }
            }
          }
        },
        net: { $subtract: ['$income', '$expense'] }
      }
    },
    {
      $project: {
        _id: 0,
        month: 1,
        income: 1,
        expense: 1,
        net: 1,
        count: 1
      }
    },
    {
      $sort: { month: 1 }
    }
  ]);
};

/**
 * Static method to get transactions by tags
 * @param userId - User ID
 * @param limit - Result limit
 * @returns Promise<Array<{ tag: string; count: number; totalAmount: number }>>
 */
transactionSchema.statics.getTagStats = function(userId: string, limit: number = 20) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
        tags: { $ne: [], $exists: true }
      }
    },
    {
      $unwind: '$tags'
    },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        lastUsed: { $max: '$date' }
      }
    },
    {
      $project: {
        tag: '$_id',
        count: 1,
        totalAmount: 1,
        lastUsed: 1,
        _id: 0
      }
    },
    {
      $sort: { count: -1, totalAmount: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

/**
 * Instance method to soft delete transaction
 * @returns Promise<ITransactionDocument>
 */
transactionSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/**
 * Virtual for transaction status
 */
transactionSchema.virtual('status').get(function() {
  if (this.isDeleted) return 'deleted';
  if (this.isRecurring) return 'recurring';
  return 'active';
});

/**
 * Virtual for formatted amount
 */
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.amount);
});

/**
 * Virtual for transaction with populated data
 */
transactionSchema.virtual('fullTransaction', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: '_id',
  justOne: true,
  populate: [
    { path: 'categoryId', select: 'name icon color type' },
    { path: 'accountId', select: 'name type currency color icon' },
    { path: 'toAccountId', select: 'name type currency color icon' },
    { path: 'profileId', select: 'name avatarColor' }
  ]
});

/**
 * Ensure virtuals are included in JSON
 */
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', transactionSchema);
