import mongoose, { Schema, Document } from 'mongoose';
import { ICategoryDocument } from '../types';

/**
 * Category Schema
 * Stores transaction categories for users
 */
const categorySchema = new Schema<ICategoryDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  icon: {
    type: String,
    required: [true, 'Category icon is required'],
    maxlength: [50, 'Icon name cannot exceed 50 characters']
  },
  color: {
    type: String,
    required: [true, 'Category color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  type: {
    type: String,
    enum: {
      values: ['EXPENSE', 'INCOME', 'BOTH'],
      message: 'Category type must be one of: EXPENSE, INCOME, BOTH'
    },
    required: [true, 'Category type is required']
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0,
    min: [0, 'Sort order cannot be negative']
  },
  monthlyBudget: {
    type: Number,
    min: [0, 'Monthly budget cannot be negative']
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
categorySchema.index({ userId: 1, isArchived: 1 });
categorySchema.index({ userId: 1, type: 1, sortOrder: 1 });
categorySchema.index({ userId: 1, name: 1 }, { unique: true, partialFilterExpression: { isArchived: false } });
categorySchema.index({ userId: 1, isDefault: 1 });
categorySchema.index({ userId: 1, parentId: 1 });

/**
 * Static method to seed default categories for a new user
 * @param userId - User ID
 * @returns Promise<ICategoryDocument[]>
 */
categorySchema.statics.seedDefaults = function(userId: string) {
  const defaultCategories = [
    // Expense Categories
    { name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B', type: 'EXPENSE', sortOrder: 0 },
    { name: 'Transport', icon: 'directions_car', color: '#4ECDC4', type: 'EXPENSE', sortOrder: 1 },
    { name: 'Shopping', icon: 'shopping_bag', color: '#45B7D1', type: 'EXPENSE', sortOrder: 2 },
    { name: 'Entertainment', icon: 'movie', color: '#96CEB4', type: 'EXPENSE', sortOrder: 3 },
    { name: 'Bills & Utilities', icon: 'receipt', color: '#FFEAA7', type: 'EXPENSE', sortOrder: 4 },
    { name: 'Health & Fitness', icon: 'fitness_center', color: '#DDA0DD', type: 'EXPENSE', sortOrder: 5 },
    { name: 'Education', icon: 'school', color: '#98D8C8', type: 'EXPENSE', sortOrder: 6 },
    { name: 'Travel', icon: 'flight', color: '#F7DC6F', type: 'EXPENSE', sortOrder: 7 },
    { name: 'Personal Care', icon: 'spa', color: '#BB8FCE', type: 'EXPENSE', sortOrder: 8 },
    { name: 'Groceries', icon: 'local_grocery_store', color: '#85C1E2', type: 'EXPENSE', sortOrder: 9 },
    { name: 'Rent/EMI', icon: 'home', color: '#F8B739', type: 'EXPENSE', sortOrder: 10 },
    { name: 'Other Expense', icon: 'more_horiz', color: '#95A5A6', type: 'EXPENSE', sortOrder: 11 },
    
    // Income Categories
    { name: 'Salary', icon: 'payments', color: '#27AE60', type: 'INCOME', sortOrder: 0 },
    { name: 'Freelance', icon: 'laptop', color: '#3498DB', type: 'INCOME', sortOrder: 1 },
    { name: 'Business', icon: 'business', color: '#9B59B6', type: 'INCOME', sortOrder: 2 },
    { name: 'Investment Returns', icon: 'trending_up', color: '#E74C3C', type: 'INCOME', sortOrder: 3 },
    { name: 'Gift', icon: 'card_giftcard', color: '#F39C12', type: 'INCOME', sortOrder: 4 },
    { name: 'Interest', icon: 'account_balance', color: '#1ABC9C', type: 'INCOME', sortOrder: 5 },
    { name: 'Rental Income', icon: 'apartment', color: '#34495E', type: 'INCOME', sortOrder: 6 },
    { name: 'Bonus', icon: 'stars', color: '#E67E22', type: 'INCOME', sortOrder: 7 },
    { name: 'Other Income', icon: 'add_circle', color: '#16A085', type: 'INCOME', sortOrder: 8 },
    
    // Neutral Categories
    { name: 'Transfer', icon: 'swap_horiz', color: '#7F8C8D', type: 'BOTH', sortOrder: 0 }
  ];

  const categoriesWithUser = defaultCategories.map(cat => ({
    ...cat,
    userId: new mongoose.Types.ObjectId(userId),
    isDefault: true
  }));

  return this.insertMany(categoriesWithUser);
};

/**
 * Static method to find user's active categories
 * @param userId - User ID
 * @param type - Optional category type filter
 * @returns Promise<ICategoryDocument[]>
 */
categorySchema.statics.findActiveByUser = function(userId: string, type?: string) {
  const query: any = { 
    userId, 
    isArchived: false 
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query).sort({ sortOrder: 1, name: 1 });
};

/**
 * Static method to find user's default categories
 * @param userId - User ID
 * @returns Promise<ICategoryDocument[]>
 */
categorySchema.statics.findDefaultsByUser = function(userId: string) {
  return this.find({ 
    userId, 
    isDefault: true, 
    isArchived: false 
  }).sort({ type: 1, sortOrder: 1 });
};

/**
 * Static method to reorder categories
 * @param userId - User ID
 * @param orderedIds - Array of category IDs in new order
 * @returns Promise<void>
 */
categorySchema.statics.reorder = function(userId: string, orderedIds: string[]) {
  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, userId },
      update: { sortOrder: index }
    }
  }));

  return this.bulkWrite(bulkOps);
};

/**
 * Static method to get category spending summary
 * @param userId - User ID
 * @param from - Start date
 * @param to - End date
 * @returns Promise<Array<{ category: ICategoryDocument; spent: number; count: number; budget?: number; remaining?: number; percentage?: number }>>
 */
categorySchema.statics.getSpendingSummary = function(userId: string, from: Date, to: Date) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isArchived: false,
        type: 'EXPENSE'
      }
    },
    {
      $lookup: {
        from: 'transactions',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$categoryId', '$$categoryId'] },
                  { $gte: ['$date', from] },
                  { $lte: ['$date', to] },
                  { $ne: ['$isDeleted', true] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              spent: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ],
        as: 'transactions'
      }
    },
    {
      $lookup: {
        from: 'budgets',
        let: { categoryId: '$_id', userId: '$userId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$categoryId', '$$categoryId'] },
                  { $eq: ['$userId', '$$userId'] },
                  { $eq: ['$month', from.getMonth() + 1] },
                  { $eq: ['$year', from.getFullYear()] }
                ]
              }
            }
          }
        ],
        as: 'budget'
      }
    },
    {
      $addFields: {
        spent: { $ifNull: [{ $arrayElemAt: ['$transactions.spent', 0] }, 0] },
        count: { $ifNull: [{ $arrayElemAt: ['$transactions.count', 0] }, 0] },
        monthlyLimit: { $ifNull: [{ $arrayElemAt: ['$budget.monthlyLimit', 0] }, null] },
        monthlyBudget: { $ifNull: [{ $arrayElemAt: ['$budget.monthlyLimit', 0] }, '$monthlyBudget'] }
      }
    },
    {
      $addFields: {
        remaining: {
          $cond: {
            if: { $gt: ['$monthlyBudget', 0] },
            then: { $subtract: ['$monthlyBudget', '$spent'] },
            else: null
          }
        },
        percentage: {
          $cond: {
            if: { $gt: ['$monthlyBudget', 0] },
            then: { $multiply: [{ $divide: ['$spent', '$monthlyBudget'] }, 100] },
            else: null
          }
        }
      }
    },
    {
      $project: {
        transactions: 0,
        budget: 0
      }
    },
    {
      $sort: { spent: -1, name: 1 }
    }
  ]);
};

/**
 * Static method to get top spending categories
 * @param userId - User ID
 * @param from - Start date
 * @param to - End date
 * @param limit - Number of categories to return
 * @returns Promise<Array<{ category: ICategoryDocument; spent: number; percentage: number }>>
 */
categorySchema.statics.getTopSpending = function(userId: string, from: Date, to: Date, limit: number = 10) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isArchived: false,
        type: 'EXPENSE'
      }
    },
    {
      $lookup: {
        from: 'transactions',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$categoryId', '$$categoryId'] },
                  { $gte: ['$date', from] },
                  { $lte: ['$date', to] },
                  { $ne: ['$isDeleted', true] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              spent: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ],
        as: 'transactions'
      }
    },
    {
      $addFields: {
        spent: { $ifNull: [{ $arrayElemAt: ['$transactions.spent', 0] }, 0] },
        count: { $ifNull: [{ $arrayElemAt: ['$transactions.count', 0] }, 0] }
      }
    },
    {
      $match: {
        spent: { $gt: 0 }
      }
    },
    {
      $sort: { spent: -1 }
    },
    {
      $limit: limit
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: '$spent' },
        categories: {
          $push: {
            id: '$_id',
            name: '$name',
            icon: '$icon',
            color: '$color',
            spent: '$spent',
            count: '$count'
          }
        }
      }
    },
    {
      $addFields: {
        categories: {
          $map: {
            input: '$categories',
            as: 'cat',
            in: {
              $mergeObjects: [
                '$$cat',
                {
                  percentage: {
                    $multiply: [
                      { $divide: ['$$cat.spent', '$totalSpent'] },
                      100
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        categories: 1
      }
    }
  ]);
};

/**
 * Instance method to check if category can be deleted
 * @returns Promise<{ canDelete: boolean; reason?: string; transactionCount?: number }>
 */
categorySchema.methods.canDelete = function() {
  const Category = this.constructor as any;
  return Category.aggregate([
    {
      $match: {
        categoryId: this._id,
        isDeleted: false
      }
    },
    {
      $count: 'transactionCount'
    }
  ]).then((result: any[]) => {
    const transactionCount = result.length > 0 ? result[0].transactionCount : 0;
    
    if (this.isDefault) {
      return { canDelete: false, reason: 'Cannot delete default categories' };
    }
    
    if (transactionCount > 0) {
      return { 
        canDelete: false, 
        reason: 'Category has associated transactions',
        transactionCount 
      };
    }
    
    return { canDelete: true };
  });
};

/**
 * Virtual for category with parent info
 */
categorySchema.virtual('withParent', {
  ref: 'Category',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

/**
 * Virtual for subcategories
 */
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
  justOne: false
});

/**
 * Ensure virtuals are included in JSON
 */
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

export const Category = mongoose.model<ICategoryDocument>('Category', categorySchema);
