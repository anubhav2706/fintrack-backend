import mongoose, { Schema, Document } from 'mongoose';
import { IAccountDocument } from '../types';

/**
 * Account Schema
 * Stores user's financial accounts (bank, cash, credit, etc.)
 */
const accountSchema = new Schema<IAccountDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [100, 'Account name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['CASH', 'BANK', 'CREDIT', 'INVESTMENT', 'SAVINGS'],
      message: 'Account type must be one of: CASH, BANK, CREDIT, INVESTMENT, SAVINGS'
    },
    required: [true, 'Account type is required']
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true,
    maxlength: [3, 'Currency code must be 3 characters']
  },
  exchangeRate: {
    type: Number,
    default: 1,
    min: [0, 'Exchange rate cannot be negative']
  },
  color: {
    type: String,
    default: '#5B5FEF',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  icon: {
    type: String,
    default: 'account_balance_wallet',
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  includeInTotal: {
    type: Boolean,
    default: true
  },
  safetyThreshold: {
    type: Number,
    default: 0,
    min: [0, 'Safety threshold cannot be negative']
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  note: {
    type: String,
    maxlength: [500, 'Note cannot exceed 500 characters'],
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

// Compound indexes
accountSchema.index({ userId: 1, isDefault: 1 }, { unique: true });
accountSchema.index({ userId: 1, isArchived: 1 });
accountSchema.index({ userId: 1, type: 1 });
accountSchema.index({ userId: 1, createdAt: -1 });

// Pre-save middleware to ensure only one default account per user
accountSchema.pre('save', async function(next) {
  if (!this.isModified('isDefault') || !this.isDefault) {
    return next();
  }

  try {
    // Unset default flag on all other accounts for this user
    await (this.constructor as mongoose.Model<IAccountDocument>).updateMany(
      { 
        userId: this.userId, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { isDefault: false }
    );
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-remove middleware to prevent deletion if it's the only account
accountSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const accountCount = await (this.constructor as mongoose.Model<IAccountDocument>).countDocuments({ 
      userId: this.userId, 
      isArchived: false 
    });
    
    if (accountCount <= 1) {
      const error = new Error('Cannot delete the last account');
      (error as any).statusCode = 400;
      return next(error);
    }
    
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Static method to find user's active accounts
 * @param userId - User ID
 * @returns Promise<IAccountDocument[]>
 */
accountSchema.statics.findActiveByUser = function(userId: string) {
  return this.find({ 
    userId, 
    isArchived: false 
  }).sort({ isDefault: -1, name: 1 });
};

/**
 * Static method to find user's default account
 * @param userId - User ID
 * @returns Promise<IAccountDocument | null>
 */
accountSchema.statics.findDefaultByUser = function(userId: string) {
  return this.findOne({ 
    userId, 
    isDefault: true, 
    isArchived: false 
  });
};

/**
 * Static method to get account balance summary
 * @param userId - User ID
 * @returns Promise<{ total: number; byType: Record<string, number> }>
 */
accountSchema.statics.getBalanceSummary = function(userId: string) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isArchived: false,
        includeInTotal: true
      }
    },
    {
      $group: {
        _id: '$type',
        totalBalance: { $sum: '$balance' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalBalance' },
        byType: {
          $push: {
            type: '$_id',
            balance: '$totalBalance',
            count: '$count'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        byType: {
          $arrayToObject: {
            $map: {
              input: '$byType',
              as: 'item',
              in: {
                k: '$$item.type',
                v: {
                  balance: '$$item.balance',
                  count: '$$item.count'
                }
              }
            }
          }
        }
      }
    }
  ]);
};

/**
 * Static method to get accounts with transaction counts
 * @param userId - User ID
 * @param days - Number of days to look back for transactions
 * @returns Promise<IAccountDocument[]>
 */
accountSchema.statics.findWithTransactionStats = function(userId: string, days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isArchived: false
      }
    },
    {
      $lookup: {
        from: 'transactions',
        let: { accountId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$accountId', '$$accountId'] },
                  { $gte: ['$date', cutoffDate] },
                  { $ne: ['$isDeleted', true] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              transactionCount: { $sum: 1 },
              totalAmount: { $sum: '$amount' }
            }
          }
        ],
        as: 'recentTransactions'
      }
    },
    {
      $addFields: {
        transactionCount: {
          $ifNull: [{ $arrayElemAt: ['$recentTransactions.transactionCount', 0] }, 0]
        },
        recentTotal: {
          $ifNull: [{ $arrayElemAt: ['$recentTransactions.totalAmount', 0] }, 0]
        }
      }
    },
    {
      $project: {
        recentTransactions: 0
      }
    },
    {
      $sort: { isDefault: -1, name: 1 }
    }
  ]);
};

/**
 * Instance method to get account balance history
 * @param days - Number of days to look back
 * @returns Promise<Array<{ date: string; balance: number }>>
 */
accountSchema.methods.getBalanceHistory = function(days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return (this.constructor as mongoose.Model<IAccountDocument>).aggregate([
    {
      $match: {
        _id: this._id
      }
    },
    {
      $lookup: {
        from: 'transactions',
        let: { accountId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$accountId', '$$accountId'] },
                  { $gte: ['$date', cutoffDate] },
                  { $ne: ['$isDeleted', true] }
                ]
              }
            }
          },
          {
            $sort: { date: 1 }
          },
          {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$date'
                  }
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
                }
              }
          }
        ],
        as: 'dailyChanges'
      }
    },
    {
      $unwind: '$dailyChanges'
    },
    {
      $sort: { 'dailyChanges._id': 1 }
    },
    {
      $group: {
        _id: null,
        history: {
          $push: {
            date: '$dailyChanges._id',
            change: { $subtract: ['$dailyChanges.income', '$dailyChanges.expense'] }
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        history: 1
      }
    }
  ]);
};

/**
 * Virtual for account status
 */
accountSchema.virtual('status').get(function() {
  if (this.isArchived) return 'archived';
  if (this.balance <= this.safetyThreshold) return 'low';
  return 'active';
});

/**
 * Virtual for formatted balance
 */
accountSchema.virtual('formattedBalance').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.balance);
});

/**
 * Ensure virtuals are included in JSON
 */
accountSchema.set('toJSON', { virtuals: true });
accountSchema.set('toObject', { virtuals: true });

export const Account = mongoose.model<IAccountDocument>('Account', accountSchema);
