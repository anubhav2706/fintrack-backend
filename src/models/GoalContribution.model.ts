import mongoose, { Schema, Document } from 'mongoose';
import { IGoalContributionDocument } from '../types';

/**
 * Goal Contribution Schema
 * Tracks contributions made towards goals
 */
const goalContributionSchema = new Schema<IGoalContributionDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  goalId: {
    type: Schema.Types.ObjectId,
    ref: 'Goal',
    required: [true, 'Goal ID is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Contribution amount is required'],
    min: [0.01, 'Contribution amount must be greater than 0']
  },
  date: {
    type: Date,
    required: [true, 'Contribution date is required'],
    index: true
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

// Indexes
goalContributionSchema.index({ userId: 1, goalId: 1, date: -1 });
goalContributionSchema.index({ userId: 1, date: -1 });
goalContributionSchema.index({ goalId: 1, date: -1 });

/**
 * Static method to find contributions by goal
 * @param goalId - Goal ID
 * @returns Promise<IGoalContributionDocument[]>
 */
goalContributionSchema.statics.findByGoal = function(goalId: string) {
  return this.find({ goalId }).sort({ date: -1 });
};

/**
 * Static method to find contributions by user
 * @param userId - User ID
 * @param options - Query options
 * @returns Promise<IGoalContributionDocument[]>
 */
goalContributionSchema.statics.findByUser = function(userId: string, options: any = {}) {
  const { page = 1, limit = 20, from, to, goalId } = options;
  
  const query: any = { userId };
  
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  
  if (goalId) query.goalId = new mongoose.Types.ObjectId(goalId);

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('goalId', 'name targetAmount currentSaved deadline icon color')
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Static method to get contribution summary by goal
 * @param goalId - Goal ID
 * @returns Promise<{ totalContributions: number; totalAmount: number; lastContribution: Date }>
 */
goalContributionSchema.statics.getSummaryByGoal = function(goalId: string) {
  return this.aggregate([
    {
      $match: {
        goalId: new mongoose.Types.ObjectId(goalId)
      }
    },
    {
      $group: {
        _id: null,
        totalContributions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        lastContribution: { $max: '$date' },
        firstContribution: { $min: '$date' },
        averageAmount: { $avg: '$amount' }
      }
    },
    {
      $project: {
        _id: 0,
        totalContributions: 1,
        totalAmount: 1,
        lastContribution: 1,
        firstContribution: 1,
        averageAmount: { $round: ['$averageAmount', 2] }
      }
    }
  ]);
};

/**
 * Static method to get monthly contribution trends
 * @param userId - User ID
 * @param months - Number of months to analyze
 * @returns Promise<Array<{ month: string; totalAmount: number; contributionCount: number }>>
 */
goalContributionSchema.statics.getMonthlyTrends = function(userId: string, months: number = 12) {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        contributionCount: { $sum: 1 },
        goals: { $addToSet: '$goalId' }
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
        uniqueGoals: { $size: '$goals' }
      }
    },
    {
      $project: {
        _id: 0,
        month: 1,
        totalAmount: 1,
        contributionCount: 1,
        uniqueGoals: 1
      }
    },
    {
      $sort: { month: 1 }
    }
  ]);
};

/**
 * Static method to get contribution statistics
 * @param userId - User ID
 * @param from - Start date
 * @param to - End date
 * @returns Promise<{ totalContributions: number; totalAmount: number; averageAmount: number; goalsContributed: number }>
 */
goalContributionSchema.statics.getStatistics = function(userId: string, from?: Date, to?: Date) {
  const match: any = {
    userId: new mongoose.Types.ObjectId(userId)
  };

  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = from;
    if (to) match.date.$lte = to;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalContributions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        averageAmount: { $avg: '$amount' },
        maxAmount: { $max: '$amount' },
        minAmount: { $min: '$amount' },
        uniqueGoals: { $addToSet: '$goalId' },
        firstContribution: { $min: '$date' },
        lastContribution: { $max: '$date' }
      }
    },
    {
      $addFields: {
        goalsContributed: { $size: '$uniqueGoals' }
      }
    },
    {
      $project: {
        _id: 0,
        totalContributions: 1,
        totalAmount: 1,
        averageAmount: { $round: ['$averageAmount', 2] },
        maxAmount: 1,
        minAmount: 1,
        goalsContributed: 1,
        firstContribution: 1,
        lastContribution: 1
      }
    }
  ]);
};

/**
 * Virtual for formatted amount
 */
goalContributionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.amount);
});

/**
 * Ensure virtuals are included in JSON
 */
goalContributionSchema.set('toJSON', { virtuals: true });
goalContributionSchema.set('toObject', { virtuals: true });

export const GoalContribution = mongoose.model<IGoalContributionDocument>('GoalContribution', goalContributionSchema);
