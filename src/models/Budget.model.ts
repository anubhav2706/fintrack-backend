import mongoose, { Schema, Document } from 'mongoose';
import { IBudgetDocument } from '../types';

/**
 * Budget Schema
 * Stores monthly budget limits for categories
 */
const budgetSchema = new Schema<IBudgetDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
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
  rolloverEnabled: {
    type: Boolean,
    default: false
  },
  rolloverAmount: {
    type: Number,
    default: 0,
    min: [0, 'Rollover amount cannot be negative']
  },
  alertThreshold: {
    type: Number,
    default: 80,
    min: [10, 'Alert threshold must be at least 10'],
    max: [100, 'Alert threshold cannot exceed 100']
  },
  alertSentAt: {
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

// Compound unique index
budgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });
budgetSchema.index({ userId: 1, month: 1, year: 1 });
budgetSchema.index({ userId: 1, alertSentAt: 1 });

/**
 * Static method to find budgets for a specific month
 * @param userId - User ID
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Promise<IBudgetDocument[]>
 */
budgetSchema.statics.findByMonth = function(userId: string, month: number, year: number) {
  return this.find({ userId, month, year })
    .populate('categoryId', 'name icon color type')
    .sort({ 'categoryId.sortOrder': 1, 'categoryId.name': 1 });
};

/**
 * Static method to get budget status with spending
 * @param userId - User ID
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Promise<Array<{ budget: IBudgetDocument; spent: number; remaining: number; percentage: number; status: string }>>
 */
budgetSchema.statics.getBudgetStatus = function(userId: string, month: number, year: number) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        month,
        year
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
        pipeline: [
          {
            $project: {
              name: 1,
              icon: 1,
              color: 1,
              type: 1,
              sortOrder: 1
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'transactions',
        let: { categoryId: '$categoryId', userId: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$categoryId', '$$categoryId'] },
                  { $eq: ['$userId', '$$userId'] },
                  { $eq: ['$type', 'EXPENSE'] },
                  { $gte: ['$date', monthStart] },
                  { $lte: ['$date', monthEnd] },
                  { $ne: ['$isDeleted', true] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              spent: { $sum: '$amount' },
              transactionCount: { $sum: 1 }
            }
          }
        ],
        as: 'spending'
      }
    },
    {
      $addFields: {
        category: { $arrayElemAt: ['$category', 0] },
        spent: { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] },
        transactionCount: { $ifNull: [{ $arrayElemAt: ['$spending.transactionCount', 0] }, 0] },
        effectiveLimit: { $add: ['$monthlyLimit', '$rolloverAmount'] },
        remaining: { $subtract: [{ $add: ['$monthlyLimit', '$rolloverAmount'] }, { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] }] }
      }
    },
    {
      $addFields: {
        percentage: {
          $cond: {
            if: { $gt: ['$effectiveLimit', 0] },
            then: { $multiply: [{ $divide: ['$spent', '$effectiveLimit'] }, 100] },
            else: 0
          }
        },
        status: {
          $switch: {
            branches: [
              { case: { $gte: ['$percentage', 100] }, then: 'EXCEEDED' },
              { case: { $gte: ['$percentage', '$alertThreshold'] }, then: 'DANGER' },
              { case: { $gte: ['$percentage', 70] }, then: 'WARNING' },
              { case: { $gte: ['$percentage', 50] }, then: 'CAUTION' }
            ],
            default: 'SAFE'
          }
        }
      }
    },
    {
      $project: {
        budget: '$$ROOT',
        spent: 1,
        remaining: 1,
        percentage: { $round: ['$percentage', 1] },
        status: 1,
        transactionCount: 1
      }
    },
    {
      $sort: { 'category.sortOrder': 1, 'category.name': 1 }
    }
  ]);
};

/**
 * Static method to copy budgets from previous month
 * @param userId - User ID
 * @param month - Target month (1-12)
 * @param year - Target year
 * @returns Promise<IBudgetDocument[]>
 */
budgetSchema.statics.copyFromPreviousMonth = function(userId: string, month: number, year: number) {
  let prevMonth = month - 1;
  let prevYear = year;
  
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        month: prevMonth,
        year: prevYear
      }
    },
    {
      $addFields: {
        newMonth: month,
        newYear: year,
        spent: 0,
        remaining: '$monthlyLimit',
        alertSentAt: null
      }
    },
    {
      $project: {
        userId: 1,
        categoryId: 1,
        monthlyLimit: 1,
        month: '$newMonth',
        year: '$newYear',
        rolloverEnabled: 1,
        rolloverAmount: {
          $cond: [
            '$rolloverEnabled',
            { $max: [0, { $subtract: ['$monthlyLimit', '$spent'] }] },
            0
          ]
        },
        alertThreshold: 1
      }
    },
    {
      $merge: {
        into: 'budgets',
        on: ['userId', 'categoryId', 'month', 'year'],
        whenMatched: 'merge',
        whenNotMatched: 'insert'
      }
    }
  ]);
};

/**
 * Static method to get budget summary
 * @param userId - User ID
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Promise<{ totalBudget: number; totalSpent: number; totalRemaining: number; averageUtilization: number; budgetsExceeded: number; budgetsAtRisk: number }>
 */
budgetSchema.statics.getSummary = function(userId: string, month: number, year: number) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        month,
        year
      }
    },
    {
      $lookup: {
        from: 'transactions',
        let: { categoryId: '$categoryId', userId: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$categoryId', '$$categoryId'] },
                  { $eq: ['$userId', '$$userId'] },
                  { $eq: ['$type', 'EXPENSE'] },
                  { $gte: ['$date', monthStart] },
                  { $lte: ['$date', monthEnd] },
                  { $ne: ['$isDeleted', true] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              spent: { $sum: '$amount' }
            }
          }
        ],
        as: 'spending'
      }
    },
    {
      $addFields: {
        spent: { $ifNull: [{ $arrayElemAt: ['$spending.spent', 0] }, 0] },
        effectiveLimit: { $add: ['$monthlyLimit', '$rolloverAmount'] },
        utilization: {
          $cond: {
            if: { $gt: [{ $add: ['$monthlyLimit', '$rolloverAmount'] }, 0] },
            then: { $multiply: [{ $divide: ['$spent', { $add: ['$monthlyLimit', '$rolloverAmount'] }] }, 100] },
            else: 0
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalBudget: { $sum: '$monthlyLimit' },
        totalSpent: { $sum: '$spent' },
        totalRollover: { $sum: '$rolloverAmount' },
        budgetsExceeded: {
          $sum: {
            $cond: [{ $gte: ['$spent', { $add: ['$monthlyLimit', '$rolloverAmount'] }] }, 1, 0]
          }
        },
        budgetsAtRisk: {
          $sum: {
            $cond: [
              { $and: [{ $gte: ['$spent', { $multiply: [{ $add: ['$monthlyLimit', '$rolloverAmount'] }, 0.8] }] }, { $lt: ['$spent', { $add: ['$monthlyLimit', '$rolloverAmount'] }] }] },
              1,
              0
            ]
          }
        },
        totalBudgets: { $sum: 1 }
      }
    },
    {
      $addFields: {
        totalEffectiveBudget: { $add: ['$totalBudget', '$totalRollover'] },
        totalRemaining: { $subtract: [{ $add: ['$totalBudget', '$totalRollover'] }, '$totalSpent'] },
        averageUtilization: {
          $cond: [
            { $gt: [{ $add: ['$totalBudget', '$totalRollover'] }, 0] },
            { $multiply: [{ $divide: ['$totalSpent', { $add: ['$totalBudget', '$totalRollover'] }] }, 100] },
            0
          ]
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalBudget: 1,
        totalSpent: 1,
        totalRemaining: 1,
        totalRollover: 1,
        totalEffectiveBudget: 1,
        averageUtilization: { $round: ['$averageUtilization', 1] },
        budgetsExceeded: 1,
        budgetsAtRisk: 1,
        totalBudgets: 1
      }
    }
  ]);
};

/**
 * Virtual for formatted monthly limit
 */
budgetSchema.virtual('formattedMonthlyLimit').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.monthlyLimit);
});

/**
 * Ensure virtuals are included in JSON
 */
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

export const Budget = mongoose.model<IBudgetDocument>('Budget', budgetSchema);
