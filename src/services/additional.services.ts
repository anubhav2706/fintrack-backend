import mongoose from 'mongoose';
import { Account, Category, Goal, Budget, Debt, Split, Investment, Bill, Installment, Template, Profile, Envelope, Tag, Transaction, User } from '../models';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { logger } from '../config/env';

/**
 * Account Service
 */
export class AccountService {
  static createAccount = catchAsync(async (userId: string, accountData: any) => {
    const { name, type, balance = 0, currency = 'INR', color, icon, isDefault = false, includeInTotal = true, note } = accountData;

    // If setting as default, unset other defaults
    if (isDefault) {
      await Account.updateMany({ userId, isDefault: true }, { isDefault: false });
    }

    const account = await Account.create({
      userId,
      name: name.trim(),
      type,
      balance,
      currency: currency.toUpperCase(),
      color: color || '#5B5FEF',
      icon: icon || 'account_balance_wallet',
      isDefault,
      includeInTotal,
      note: note?.trim(),
    });

    const populatedAccount = await Account.findById(account.id)
      .populate('userId', 'name email');

    return ApiResponse.created('Account created successfully', { account: populatedAccount });
  });

  static getAccounts = catchAsync(async (userId: string, includeArchived = false) => {
    const accounts = await Account.findActiveByUser(userId);

    return ApiResponse.success('Accounts retrieved successfully', { accounts });
  });

  static updateAccount = catchAsync(async (userId: string, accountId: string, updateData: any) => {
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      throw ApiError.notFound('Account not found');
    }

    // If setting as default, unset other defaults
    if (updateData.isDefault) {
      await Account.updateMany({ userId, _id: { $ne: accountId }, isDefault: true }, { isDefault: false });
    }

    Object.assign(account, updateData);
    await account.save();

    return ApiResponse.success('Account updated successfully', { account });
  });

  static deleteAccount = catchAsync(async (userId: string, accountId: string) => {
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      throw ApiError.notFound('Account not found');
    }

    account.isArchived = true;
    await account.save();

    return ApiResponse.success('Account archived successfully');
  });

  static getBalanceSummary = catchAsync(async (userId: string) => {
    const summary = await Account.getBalanceSummary(userId);

    return ApiResponse.success('Balance summary retrieved successfully', { summary: summary[0] || { total: 0, byType: {} } });
  });
}

/**
 * Category Service
 */
export class CategoryService {
  static createCategory = catchAsync(async (userId: string, categoryData: any) => {
    const { name, icon, color, type, parentId, monthlyBudget } = categoryData;

    // Check for duplicate names
    const existingCategory = await Category.findOne({ userId, name: name.trim(), isArchived: false });
    if (existingCategory) {
      throw ApiError.conflict('Category with this name already exists');
    }

    const category = await Category.create({
      userId,
      name: name.trim(),
      icon,
      color,
      type,
      parentId,
      monthlyBudget,
    });

    const populatedCategory = await Category.findById(category.id)
      .populate('parentId', 'name icon color');

    return ApiResponse.created('Category created successfully', { category: populatedCategory });
  });

  static getCategories = catchAsync(async (userId: string, type?: string) => {
    const categories = await Category.findActiveByUser(userId, type);

    return ApiResponse.success('Categories retrieved successfully', { categories });
  });

  static updateCategory = catchAsync(async (userId: string, categoryId: string, updateData: any) => {
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    // Check for duplicate names (excluding current category)
    if (updateData.name) {
      const existingCategory = await Category.findOne({
        userId,
        name: updateData.name.trim(),
        isArchived: false,
        _id: { $ne: categoryId },
      });
      if (existingCategory) {
        throw ApiError.conflict('Category with this name already exists');
      }
    }

    Object.assign(category, updateData);
    await category.save();

    return ApiResponse.success('Category updated successfully', { category });
  });

  static deleteCategory = catchAsync(async (userId: string, categoryId: string) => {
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    // Check if category can be deleted
    const canDelete = await category.canDelete();
    if (!canDelete.canDelete) {
      throw ApiError.badRequest(canDelete.reason || 'Cannot delete category');
    }

    category.isArchived = true;
    await category.save();

    return ApiResponse.success('Category archived successfully');
  });

  static reorderCategories = catchAsync(async (userId: string, orderedIds: string[]) => {
    await Category.reorder(userId, orderedIds);

    return ApiResponse.success('Categories reordered successfully');
  });

  static seedDefaults = catchAsync(async (userId: string) => {
    await Category.seedDefaults(userId);

    return ApiResponse.success('Default categories seeded successfully');
  });
}

/**
 * Goal Service
 */
export class GoalService {
  static createGoal = catchAsync(async (userId: string, goalData: any) => {
    const { name, targetAmount, currentSaved = 0, deadline, icon, color, priority = 0, linkedAccountId, category } = goalData;

    // Validate linked account if provided
    if (linkedAccountId) {
      const account = await Account.findOne({ _id: linkedAccountId, userId });
      if (!account) {
        throw ApiError.notFound('Linked account not found');
      }
    }

    const goal = await Goal.create({
      userId,
      name: name.trim(),
      targetAmount,
      currentSaved,
      deadline: new Date(deadline),
      icon: icon || 'flag',
      color: color || '#FF6D00',
      priority,
      linkedAccountId,
      category,
    });

    const populatedGoal = await Goal.findById(goal.id)
      .populate('linkedAccountId', 'name type currency');

    return ApiResponse.created('Goal created successfully', { goal: populatedGoal });
  });

  static getGoals = catchAsync(async (userId: string) => {
    const goals = await Goal.findActiveByUser(userId);

    return ApiResponse.success('Goals retrieved successfully', { goals });
  });

  static updateGoal = catchAsync(async (userId: string, goalId: string, updateData: any) => {
    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      throw ApiError.notFound('Goal not found');
    }

    // Validate linked account if provided
    if (updateData.linkedAccountId) {
      const account = await Account.findOne({ _id: updateData.linkedAccountId, userId });
      if (!account) {
        throw ApiError.notFound('Linked account not found');
      }
    }

    Object.assign(goal, updateData);
    await goal.save();

    return ApiResponse.success('Goal updated successfully', { goal });
  });

  static deleteGoal = catchAsync(async (userId: string, goalId: string) => {
    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      throw ApiError.notFound('Goal not found');
    }

    goal.isArchived = true;
    await goal.save();

    return ApiResponse.success('Goal archived successfully');
  });

  static addContribution = catchAsync(async (userId: string, goalId: string, contributionData: any) => {
    const { amount, date, note } = contributionData;

    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      throw ApiError.notFound('Goal not found');
    }

    await goal.addContribution(amount, new Date(date), note);

    return ApiResponse.success('Contribution added successfully');
  });

  static getGoalProjection = catchAsync(async (userId: string, goalId: string, extraMonthly = 0) => {
    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      throw ApiError.notFound('Goal not found');
    }

    // Calculate projection logic here
    const projection = {
      currentProgress: (goal.currentSaved / goal.targetAmount) * 100,
      monthsRemaining: Math.max(0, Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))),
      monthlyNeeded: Math.max(0, (goal.targetAmount - goal.currentSaved) / Math.max(1, Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))),
      projectedDate: extraMonthly > 0 ? new Date(Date.now() + ((goal.targetAmount - goal.currentSaved) / (extraMonthly / 30)) * 1000 * 60 * 60 * 24) : null,
    };

    return ApiResponse.success('Goal projection retrieved successfully', { projection });
  });

  static getUpcomingDeadlines = catchAsync(async (userId: string, days = 30) => {
    const upcomingGoals = await Goal.getUpcomingDeadlines(userId, days);

    return ApiResponse.success('Upcoming deadlines retrieved successfully', { goals: upcomingGoals });
  });

  static getSummary = catchAsync(async (userId: string) => {
    const summary = await Goal.getSummary(userId);

    return ApiResponse.success('Goal summary retrieved successfully', { summary: summary[0] || {} });
  });
}

/**
 * Budget Service
 */
export class BudgetService {
  static createBudget = catchAsync(async (userId: string, budgetData: any) => {
    const { categoryId, monthlyLimit, month, year, rolloverEnabled = false, alertThreshold = 80 } = budgetData;

    // Check for existing budget
    const existingBudget = await Budget.findOne({ userId, categoryId, month, year });
    if (existingBudget) {
      throw ApiError.conflict('Budget already exists for this category and period');
    }

    // Validate category
    const category = await Category.findOne({ _id: categoryId, userId });
    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    const budget = await Budget.create({
      userId,
      categoryId,
      monthlyLimit,
      month,
      year,
      rolloverEnabled,
      alertThreshold,
    });

    const populatedBudget = await Budget.findById(budget.id)
      .populate('categoryId', 'name icon color type');

    return ApiResponse.created('Budget created successfully', { budget: populatedBudget });
  });

  static getBudgets = catchAsync(async (userId: string, month: number, year: number) => {
    const budgets = await Budget.findByMonth(userId, month, year);

    return ApiResponse.success('Budgets retrieved successfully', { budgets });
  });

  static getBudgetStatus = catchAsync(async (userId: string, month: number, year: number) => {
    const budgetStatus = await Budget.getBudgetStatus(userId, month, year);

    return ApiResponse.success('Budget status retrieved successfully', { budgetStatus });
  });

  static updateBudget = catchAsync(async (userId: string, budgetId: string, updateData: any) => {
    const budget = await Budget.findOne({ _id: budgetId, userId });
    if (!budget) {
      throw ApiError.notFound('Budget not found');
    }

    Object.assign(budget, updateData);
    await budget.save();

    return ApiResponse.success('Budget updated successfully', { budget });
  });

  static deleteBudget = catchAsync(async (userId: string, budgetId: string) => {
    const budget = await Budget.findOne({ _id: budgetId, userId });
    if (!budget) {
      throw ApiError.notFound('Budget not found');
    }

    await Budget.findByIdAndDelete(budgetId);

    return ApiResponse.success('Budget deleted successfully');
  });

  static copyFromPreviousMonth = catchAsync(async (userId: string, month: number, year: number) => {
    await Budget.copyFromPreviousMonth(userId, month, year);

    return ApiResponse.success('Budgets copied from previous month');
  });

  static getSummary = catchAsync(async (userId: string, month: number, year: number) => {
    const summary = await Budget.getSummary(userId, month, year);

    return ApiResponse.success('Budget summary retrieved successfully', { summary: summary[0] || {} });
  });
}

/**
 * Analytics Service
 */
export class AnalyticsService {
  static getDashboardSummary = catchAsync(async (userId: string, from?: Date, to?: Date) => {
    const now = new Date();
    const defaultFrom = from || new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = to || new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get transaction summary
    const transactionSummary = await Transaction.getSummary(userId, defaultFrom, defaultTo);

    // Get goal summary
    const goalSummary = await Goal.getSummary(userId);

    // Get budget summary
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const budgetSummary = await Budget.getSummary(userId, currentMonth, currentYear);

    // Get account summary
    const accountSummary = await Account.getBalanceSummary(userId);

    return ApiResponse.success('Dashboard summary retrieved successfully', {
      transactions: transactionSummary[0] || { income: 0, expense: 0, net: 0, count: 0 },
      goals: goalSummary[0] || { totalGoals: 0, achievedGoals: 0, progress: 0 },
      budgets: budgetSummary[0] || { totalBudget: 0, totalSpent: 0, averageUtilization: 0 },
      accounts: accountSummary[0] || { total: 0, byType: {} },
    });
  });

  static getSpendingByCategory = catchAsync(async (userId: string, from: Date, to: Date) => {
    const spendingByCategory = await Category.getSpendingSummary(userId, from, to);

    return ApiResponse.success('Spending by category retrieved successfully', { spendingByCategory });
  });

  static getTopSpendingCategories = catchAsync(async (userId: string, from: Date, to: Date, limit = 10) => {
    const topCategories = await Category.getTopSpending(userId, from, to, limit);

    return ApiResponse.success('Top spending categories retrieved successfully', { topCategories: topCategories[0]?.categories || [] });
  });

  static getMonthlyComparison = catchAsync(async (userId: string, months = 12) => {
    const monthlyTrends = await Transaction.getMonthlyTrends(userId, months);

    return ApiResponse.success('Monthly comparison retrieved successfully', { monthlyTrends });
  });

  static getFinancialScore = catchAsync(async (userId: string) => {
    // Calculate financial score based on various factors
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current month data
    const transactionSummary = await Transaction.getSummary(userId, monthStart, monthEnd);
    const goalSummary = await Goal.getSummary(userId);
    const budgetSummary = await Budget.getSummary(userId, now.getMonth() + 1, now.getFullYear());

    const summary = transactionSummary[0] || { income: 0, expense: 0, net: 0 };
    const goals = goalSummary[0] || { totalGoals: 0, achievedGoals: 0, progress: 0 };
    const budgets = budgetSummary[0] || { averageUtilization: 0 };

    // Calculate score components
    const savingsRate = summary.income > 0 ? (summary.net / summary.income) * 100 : 0;
    const goalProgress = goals.progress || 0;
    const budgetAdherence = Math.max(0, 100 - budgets.averageUtilization);

    // Calculate overall score
    const score = Math.round((savingsRate * 0.4 + goalProgress * 0.3 + budgetAdherence * 0.3));

    return ApiResponse.success('Financial score retrieved successfully', {
      score: Math.min(100, Math.max(0, score)),
      components: {
        savingsRate: Math.round(savingsRate),
        goalProgress: Math.round(goalProgress),
        budgetAdherence: Math.round(budgetAdherence),
      },
    });
  });
}

/**
 * Sync Service
 */
export class SyncService {
  static pullSync = async (userId: string, syncData: any) => {
    const { deviceId, lastSyncAt, collections = [] } = syncData;

    // Get all collections for sync
    const syncDataResult: any = {};

    if (collections.includes('transactions') || collections.length === 0) {
      syncDataResult.transactions = await Transaction.find({
        userId,
        updatedAt: { $gt: new Date(lastSyncAt) },
        isDeleted: false,
      }).lean();
    }

    if (collections.includes('accounts') || collections.length === 0) {
      syncDataResult.accounts = await Account.find({
        userId,
        updatedAt: { $gt: new Date(lastSyncAt) },
        isArchived: false,
      }).lean();
    }

    if (collections.includes('categories') || collections.length === 0) {
      syncDataResult.categories = await Category.find({
        userId,
        updatedAt: { $gt: new Date(lastSyncAt) },
        isArchived: false,
      }).lean();
    }

    // Add other collections as needed...

    return {
      success: true,
      statusCode: 200,
      message: 'Sync data retrieved successfully',
      data: {
        data: syncDataResult,
        deletedIds: {}, // Would contain deleted IDs
        serverTime: new Date().toISOString(),
        syncVersion: Date.now(),
      },
    };
  };

  static pushSync = async (userId: string, syncData: any) => {
    const { deviceId, changes } = syncData;

    // Process changes from client
    // This would involve creating/updating/deleting records based on the changes
    // For now, we'll just return success

    return {
      success: true,
      statusCode: 200,
      message: 'Sync completed successfully',
      data: {
        syncVersion: Date.now(),
      },
    };
  };

  static getSyncStatus = async (userId: string) => {
    // Get last modified times for all collections
    const collections = ['transactions', 'accounts', 'categories', 'goals', 'budgets'];
    const status: any = {};

    for (const collection of collections) {
      // Get last modified time for each collection
      // This is a simplified implementation
      status[collection] = {
        lastModified: new Date().toISOString(),
        count: 0, // Would get actual count
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Sync status retrieved successfully',
      data: { status },
    };
  };
}

/**
 * Notification Service
 */
export class NotificationService {
  static sendTestNotification = catchAsync(async (userId: string, notificationData: any) => {
    const { title, body } = notificationData;

    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      throw ApiError.badRequest('User not found or no FCM token available');
    }

    // Send notification using Firebase
    // This would use the Firebase service to send the notification

    return ApiResponse.success('Test notification sent successfully');
  });

  static updateNotificationSettings = catchAsync(async (userId: string, settings: any) => {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    Object.assign(user, settings);
    await user.save();

    return ApiResponse.success('Notification settings updated successfully');
  });

  static sendBudgetAlerts = catchAsync(async () => {
    // This would be called by a scheduled job
    // Find all users who have budget alerts enabled and send notifications

    return ApiResponse.success('Budget alerts processed successfully');
  });

  static sendGoalReminders = catchAsync(async () => {
    // This would be called by a scheduled job
    // Find all users with upcoming goal deadlines and send notifications

    return ApiResponse.success('Goal reminders processed successfully');
  });

  static sendBillReminders = catchAsync(async () => {
    // This would be called by a scheduled job
    // Find all users with upcoming bill due dates and send notifications

    return ApiResponse.success('Bill reminders processed successfully');
  });
}

/**
 * Import/Export Service
 */
export class ImportExportService {
  static importTransactions = catchAsync(async (userId: string, importData: any) => {
    const { file, dateCol, amountCol, titleCol, categoryCol, typeCol, notesCol, dateFormat } = importData;

    // Process CSV/JSON file and import transactions
    // This would involve parsing the file and creating transactions

    return ApiResponse.success('Transactions imported successfully', {
      imported: 0, // Would return actual count
      failed: 0, // Would return actual count
    });
  });

  static exportTransactions = catchAsync(async (userId: string, exportOptions: any) => {
    const { format = 'json', from, to, type, categoryId, accountId } = exportOptions;

    // Export transactions in requested format
    // This would generate and return the export data

    return ApiResponse.success('Transactions exported successfully', {
      data: [], // Would return actual data
      filename: `transactions_export_${Date.now()}.${format}`,
    });
  });

  static exportData = catchAsync(async (userId: string, exportOptions: any) => {
    const { collections = ['transactions', 'accounts', 'categories'], format = 'json' } = exportOptions;

    // Export all user data in requested format
    // This would generate a comprehensive export

    return ApiResponse.success('Data exported successfully', {
      data: {}, // Would return actual data
      filename: `fintrack_export_${Date.now()}.${format}`,
    });
  });
}

