import mongoose, { Schema, Document } from 'mongoose';
import { IDebtDocument, ISplitDocument } from '../types';

/**
 * Debt Schema
 * Tracks money owed to or from others
 */
const debtSchema = new Schema<IDebtDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  personName: {
    type: String,
    required: [true, 'Person name is required'],
    trim: true,
    maxlength: [100, 'Person name cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  type: {
    type: String,
    enum: {
      values: ['I_OWE', 'THEY_OWE'],
      message: 'Debt type must be either I_OWE or THEY_OWE'
    },
    required: [true, 'Debt type is required']
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value: Date) {
        return !value || value >= new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  isSettled: {
    type: Boolean,
    default: false
  },
  settledAt: {
    type: Date
  },
  note: {
    type: String,
    maxlength: [500, 'Note cannot exceed 500 characters'],
    trim: true
  },
  relatedTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction'
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

// Debt indexes
debtSchema.index({ userId: 1, isSettled: 1 });
debtSchema.index({ userId: 1, type: 1 });
debtSchema.index({ userId: 1, dueDate: 1 });

/**
 * Split Schema
 * Tracks shared expenses and split payments
 */
const splitSchema = new Schema<ISplitDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Split title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0.01, 'Total amount must be greater than 0']
  },
  paidByAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Paid by account ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Split date is required'],
    index: true
  },
  note: {
    type: String,
    maxlength: [500, 'Note cannot exceed 500 characters'],
    trim: true
  },
  members: [{
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
      maxlength: [100, 'Member name cannot exceed 100 characters']
    },
    shareAmount: {
      type: Number,
      required: [true, 'Share amount is required'],
      min: [0, 'Share amount cannot be negative']
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date
    }
  }]
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

// Split indexes
splitSchema.index({ userId: 1, date: -1 });
splitSchema.index({ userId: 1, 'members.isPaid': 1 });

// Pre-save middleware for split validation
splitSchema.pre('save', function(next) {
  if (this.members && this.members.length > 0) {
    const totalShares = (this.members as any[]).reduce((sum: number, member: any) => sum + member.shareAmount, 0);
    if (Math.abs(totalShares - this.totalAmount) > 0.01) {
      const error = new Error('Sum of member shares must equal total amount');
      (error as any).statusCode = 400;
      return next(error);
    }
  }
  next();
});

/**
 * Debt Static Methods
 */

/**
 * Find user's active debts
 */
debtSchema.statics.findActiveByUser = function(userId: string, type?: string) {
  const query: any = { userId, isSettled: false };
  if (type) query.type = type;
  
  return this.find(query)
    .populate('relatedTransactionId', 'title date amount')
    .sort({ dueDate: 1, createdAt: -1 });
};

/**
 * Get debt summary
 */
debtSchema.statics.getSummary = function(userId: string) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        settled: {
          $sum: {
            $cond: ['$isSettled', 1, 0]
          }
        },
        pending: {
          $sum: {
            $cond: ['$isSettled', 0, 1]
          }
        }
      }
    },
    {
      $project: {
        type: '$_id',
        totalAmount: 1,
        count: 1,
        settled: 1,
        pending: 1,
        _id: 0
      }
    }
  ]);
};

/**
 * Get overdue debts
 */
debtSchema.statics.getOverdue = function(userId: string) {
  return this.find({
    userId,
    isSettled: false,
    dueDate: { $lt: new Date() }
  }).sort({ dueDate: 1 });
};

/**
 * Split Static Methods
 */

/**
 * Find user's splits
 */
splitSchema.statics.findByUser = function(userId: string, options: any = {}) {
  const { page = 1, limit = 20, isCompleted } = options;
  
  const query: any = { userId };
  if (isCompleted !== undefined) {
    const allPaid = { $size: { $filter: { input: '$members', cond: { $eq: ['$$item.isPaid', true] } } } };
    const totalMembers = { $size: '$members' };
    query.$expr = isCompleted 
      ? { $eq: [allPaid, totalMembers] }
      : { $lt: [allPaid, totalMembers] };
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('paidByAccountId', 'name type currency color icon')
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Get split summary
 */
splitSchema.statics.getSummary = function(userId: string) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $addFields: {
        totalMembers: { $size: '$members' },
        paidMembers: {
          $size: {
            $filter: {
              input: '$members',
              cond: { $eq: ['$$item.isPaid', true] }
            }
          }
        },
        pendingAmount: {
          $sum: {
            $filter: {
              input: '$members',
              cond: { $eq: ['$$item.isPaid', false] }
            }
          }
        }
      }
    },
    {
      $addFields: {
        isCompleted: { $eq: ['$totalMembers', '$paidMembers'] },
        completionPercentage: {
          $multiply: [
            { $divide: ['$paidMembers', '$totalMembers'] },
            100
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalSplits: { $sum: 1 },
        completedSplits: {
          $sum: {
            $cond: ['$isCompleted', 1, 0]
          }
        },
        pendingSplits: {
          $sum: {
            $cond: ['$isCompleted', 0, 1]
          }
        },
        totalAmount: { $sum: '$totalAmount' },
        pendingAmount: { $sum: '$pendingAmount' },
        averageCompletion: { $avg: '$completionPercentage' }
      }
    },
    {
      $project: {
        _id: 0,
        totalSplits: 1,
        completedSplits: 1,
        pendingSplits: 1,
        totalAmount: 1,
        pendingAmount: 1,
        averageCompletion: { $round: ['$averageCompletion', 1] }
      }
    }
  ]);
};

/**
 * Instance Methods
 */

/**
 * Settle debt
 */
debtSchema.methods.settle = function(transactionId?: string) {
  this.isSettled = true;
  this.settledAt = new Date();
  if (transactionId) {
    this.relatedTransactionId = new mongoose.Types.ObjectId(transactionId);
  }
  return this.save();
};

/**
 * Mark split member as paid
 */
splitSchema.methods.markMemberPaid = function(memberIndex: number) {
  if (this.members[memberIndex]) {
    this.members[memberIndex].isPaid = true;
    this.members[memberIndex].paidAt = new Date();
  }
  return this.save();
};

/**
 * Virtuals for Debt
 */
debtSchema.virtual('status').get(function() {
  if (this.isSettled) return 'settled';
  if (this.dueDate && this.dueDate < new Date()) return 'overdue';
  return 'pending';
});

debtSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate || this.isSettled) return null;
  const today = new Date();
  const diffTime = this.dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

debtSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.amount);
});

/**
 * Virtuals for Split
 */
splitSchema.virtual('status').get(function() {
  const paidCount = (this.members as any[]).filter((m: any) => m.isPaid).length;
  if (paidCount === 0) return 'pending';
  if (paidCount === this.members.length) return 'completed';
  return 'partial';
});

splitSchema.virtual('paidAmount').get(function() {
  return (this.members as any[])
    .filter((m: any) => m.isPaid)
    .reduce((sum: number, m: any) => sum + m.shareAmount, 0);
});

splitSchema.virtual('pendingAmount').get(function() {
  return (this.members as any[])
    .filter((m: any) => !m.isPaid)
    .reduce((sum: number, m: any) => sum + m.shareAmount, 0);
});

splitSchema.virtual('completionPercentage').get(function() {
  const paidCount = (this.members as any[]).filter((m: any) => m.isPaid).length;
  return Math.round((paidCount / this.members.length) * 100);
});

splitSchema.virtual('formattedTotalAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.totalAmount);
});

/**
 * Ensure virtuals are included in JSON
 */
debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });
splitSchema.set('toJSON', { virtuals: true });
splitSchema.set('toObject', { virtuals: true });

export const Debt = mongoose.model<IDebtDocument>('Debt', debtSchema);
export const Split = mongoose.model<ISplitDocument>('Split', splitSchema);
