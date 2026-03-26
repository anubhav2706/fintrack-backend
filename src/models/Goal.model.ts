import mongoose, { Schema, Document } from 'mongoose';
import { IGoalDocument } from '../types';

/**
 * Goal Schema
 * Stores user's financial goals and savings targets
 */
const goalSchema = new Schema<IGoalDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true,
    maxlength: [100, 'Goal name cannot exceed 100 characters']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be greater than 0']
  },
  currentSaved: {
    type: Number,
    default: 0,
    min: [0, 'Current saved amount cannot be negative']
  },
  deadline: {
    type: Date,
    required: [true, 'Goal deadline is required'],
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  icon: {
    type: String,
    default: 'flag',
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  color: {
    type: String,
    default: '#FF6D00',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Priority cannot be negative'],
    max: [10, 'Priority cannot exceed 10']
  },
  isAchieved: {
    type: Boolean,
    default: false
  },
  achievedAt: {
    type: Date
  },
  linkedAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account'
  },
  category: {
    type: String,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
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

// Indexes
goalSchema.index({ userId: 1, isArchived: 1 });
goalSchema.index({ userId: 1, priority: -1 });
goalSchema.index({ userId: 1, deadline: 1 });
goalSchema.index({ userId: 1, isAchieved: 1 });

// Pre-save middleware to check if goal is achieved
goalSchema.pre('save', function(next) {
  if (!this.isAchieved && this.currentSaved >= this.targetAmount) {
    this.isAchieved = true;
    this.achievedAt = new Date();
  } else if (this.isAchieved && this.currentSaved < this.targetAmount) {
    this.isAchieved = false;
    this.achievedAt = undefined;
  }
  next();
});

/**
 * Static method to find user's active goals
 * @param userId - User ID
 * @returns Promise<IGoalDocument[]>
 */
goalSchema.statics.findActiveByUser = function(userId: string) {
  return this.find({ 
    userId, 
    isArchived: false 
  }).populate('linkedAccountId', 'name type currency')
   .sort({ priority: -1, deadline: 1 });
};

/**
 * Static method to find user's achieved goals
 * @param userId - User ID
 * @returns Promise<IGoalDocument[]>
 */
goalSchema.statics.findAchievedByUser = function(userId: string) {
  return this.find({ 
    userId, 
    isAchieved: true, 
    isArchived: false 
  }).populate('linkedAccountId', 'name type currency')
   .sort({ achievedAt: -1 });
};

/**
 * Static method to get goals summary
 * @param userId - User ID
 * @returns Promise<{ totalGoals: number; achievedGoals: number; totalTarget: number; totalSaved: number; progress: number }>
 */
goalSchema.statics.getSummary = function(userId: string) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isArchived: false
      }
    },
    {
      $group: {
        _id: null,
        totalGoals: { $sum: 1 },
        achievedGoals: {
          $sum: {
            $cond: ['$isAchieved', 1, 0]
          }
        },
        totalTarget: { $sum: '$targetAmount' },
        totalSaved: { $sum: '$currentSaved' },
        activeGoals: {
          $sum: {
            $cond: [{ $and: [{ $ne: ['$isAchieved', true] }, { $gt: ['$deadline', new Date()] }] }, 1, 0]
          }
        },
        overdueGoals: {
          $sum: {
            $cond: [{ $and: [{ $ne: ['$isAchieved', true] }, { $lt: ['$deadline', new Date()] }] }, 1, 0]
          }
        }
      }
    },
    {
      $addFields: {
        progress: {
          $cond: [
            { $gt: ['$totalTarget', 0] },
            { $multiply: [{ $divide: ['$totalSaved', '$totalTarget'] }, 100] },
            0
          ]
        },
        achievementRate: {
          $cond: [
            { $gt: ['$totalGoals', 0] },
            { $multiply: [{ $divide: ['$achievedGoals', '$totalGoals'] }, 100] },
            0
          ]
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalGoals: 1,
        achievedGoals: 1,
        totalTarget: 1,
        totalSaved: 1,
        progress: 1,
        achievementRate: 1,
        activeGoals: 1,
        overdueGoals: 1
      }
    }
  ]);
};

/**
 * Static method to get upcoming deadlines
 * @param userId - User ID
 * @param days - Days ahead to look
 * @returns Promise<Array<{ goal: IGoalDocument; daysUntilDeadline: number; monthlyNeeded: number }>>
 */
goalSchema.statics.getUpcomingDeadlines = function(userId: string, days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isArchived: false,
        isAchieved: false,
        deadline: { $lte: futureDate, $gt: new Date() }
      }
    },
    {
      $addFields: {
        daysUntilDeadline: {
          $divide: [
            { $subtract: ['$deadline', new Date()] },
            1000 * 60 * 60 * 24 // Convert milliseconds to days
          ]
        },
        remainingAmount: { $subtract: ['$targetAmount', '$currentSaved'] },
        monthlyNeeded: {
          $ceil: {
            $divide: [
              { $subtract: ['$targetAmount', '$currentSaved'] },
              { $ceil: { $divide: [{ $subtract: ['$deadline', new Date()] }, 1000 * 60 * 60 * 24 * 30] } }
            ]
          }
        }
      }
    },
    {
      $project: {
        id: '$_id',
        name: 1,
        targetAmount: 1,
        currentSaved: 1,
        deadline: 1,
        icon: 1,
        color: 1,
        priority: 1,
        daysUntilDeadline: { $round: ['$daysUntilDeadline', 0] },
        remainingAmount: 1,
        monthlyNeeded: 1,
        progress: {
          $multiply: [
            { $divide: ['$currentSaved', '$targetAmount'] },
            100
          ]
        }
      }
    },
    {
      $sort: { deadline: 1 }
    }
  ]);
};

/**
 * Instance method to add contribution
 * @param amount - Contribution amount
 * @param date - Contribution date
 * @param note - Optional note
 * @returns Promise<IGoalContributionDocument>
 */
goalSchema.methods.addContribution = function(amount: number, date: Date, note?: string) {
  const GoalContribution = mongoose.model('GoalContribution');
  this.currentSaved += amount;
  
  return Promise.all([
    this.save(),
    new GoalContribution({
      userId: this.userId,
      goalId: this._id,
      amount,
      date,
      note
    }).save()
  ]);
};

/**
 * Virtual for progress percentage
 */
goalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.round((this.currentSaved / this.targetAmount) * 100);
});

/**
 * Virtual for remaining amount
 */
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.targetAmount - this.currentSaved);
});

/**
 * Virtual for days until deadline
 */
goalSchema.virtual('daysUntilDeadline').get(function() {
  const today = new Date();
  const diffTime = this.deadline.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

/**
 * Virtual for formatted target amount
 */
goalSchema.virtual('formattedTargetAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.targetAmount);
});

/**
 * Virtual for formatted current saved
 */
goalSchema.virtual('formattedCurrentSaved').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(this.currentSaved);
});

/**
 * Virtual for goal status
 */
goalSchema.virtual('status').get(function() {
  if (this.isArchived) return 'archived';
  if (this.isAchieved) return 'achieved';
  if (this.deadline < new Date()) return 'overdue';
  return 'active';
});

/**
 * Ensure virtuals are included in JSON
 */
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

export const Goal = mongoose.model<IGoalDocument>('Goal', goalSchema);
