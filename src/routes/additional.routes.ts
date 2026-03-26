import { Router } from 'express';
import {
  AccountController,
  CategoryController,
  GoalController,
  BudgetController,
  AnalyticsController,
  SyncController,
  NotificationController,
  ImportExportController,
  HealthController,
} from '../controllers';
import { validate, protect, uploadImport } from '../middleware';
import {
  CreateAccountSchema,
  UpdateAccountSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryReorderSchema,
  CreateGoalSchema,
  UpdateGoalSchema,
  GoalContributionSchema,
  CreateBudgetSchema,
  UpdateBudgetSchema,
  MonthYearQuerySchema,
  PaginationQuerySchema,
  TestNotificationSchema,
  NotificationSettingsSchema,
} from '../schemas';

const router = Router();

/**
 * Account Routes
 */
router.post(
  '/accounts',
  protect,
  validate(CreateAccountSchema),
  AccountController.createAccount
);

router.get(
  '/accounts',
  protect,
  AccountController.getAccounts
);

router.put(
  '/accounts/:id',
  protect,
  validate(UpdateAccountSchema),
  AccountController.updateAccount
);

router.delete(
  '/accounts/:id',
  protect,
  AccountController.deleteAccount
);

router.get(
  '/accounts/summary',
  protect,
  AccountController.getBalanceSummary
);

router.post(
  '/accounts/:id/transfer',
  protect,
  AccountController.transferAmount
);

router.get(
  '/accounts/:id/forecast',
  protect,
  AccountController.getAccountForecast
);

/**
 * Category Routes
 */
router.post(
  '/categories',
  protect,
  validate(CreateCategorySchema),
  CategoryController.createCategory
);

router.get(
  '/categories',
  protect,
  CategoryController.getCategories
);

router.put(
  '/categories/:id',
  protect,
  validate(UpdateCategorySchema),
  CategoryController.updateCategory
);

router.delete(
  '/categories/:id',
  protect,
  CategoryController.deleteCategory
);

router.post(
  '/categories/reorder',
  protect,
  validate(CategoryReorderSchema),
  CategoryController.reorderCategories
);

router.post(
  '/categories/seed',
  protect,
  CategoryController.seedDefaults
);

router.get(
  '/categories/spending',
  protect,
  CategoryController.getSpendingByCategory
);

router.get(
  '/categories/top-spending',
  protect,
  CategoryController.getTopSpendingCategories
);

/**
 * Goal Routes
 */
router.post(
  '/goals',
  protect,
  validate(CreateGoalSchema),
  GoalController.createGoal
);

router.get(
  '/goals',
  protect,
  GoalController.getGoals
);

router.put(
  '/goals/:id',
  protect,
  validate(UpdateGoalSchema),
  GoalController.updateGoal
);

router.delete(
  '/goals/:id',
  protect,
  GoalController.deleteGoal
);

router.post(
  '/goals/:id/contributions',
  protect,
  validate(GoalContributionSchema),
  GoalController.addContribution
);

router.get(
  '/goals/:id/projection',
  protect,
  GoalController.getGoalProjection
);

router.get(
  '/goals/upcoming-deadlines',
  protect,
  GoalController.getUpcomingDeadlines
);

router.get(
  '/goals/summary',
  protect,
  GoalController.getSummary
);

/**
 * Budget Routes
 */
router.post(
  '/budgets',
  protect,
  validate(CreateBudgetSchema),
  BudgetController.createBudget
);

router.get(
  '/budgets',
  protect,
  validate(MonthYearQuerySchema),
  BudgetController.getBudgets
);

router.get(
  '/budgets/status',
  protect,
  validate(MonthYearQuerySchema),
  BudgetController.getBudgetStatus
);

router.put(
  '/budgets/:id',
  protect,
  validate(UpdateBudgetSchema),
  BudgetController.updateBudget
);

router.delete(
  '/budgets/:id',
  protect,
  BudgetController.deleteBudget
);

router.post(
  '/budgets/copy',
  protect,
  validate(MonthYearQuerySchema),
  BudgetController.copyFromPreviousMonth
);

router.get(
  '/budgets/summary',
  protect,
  validate(MonthYearQuerySchema),
  BudgetController.getSummary
);

/**
 * Analytics Routes
 */
router.get(
  '/analytics/dashboard',
  protect,
  AnalyticsController.getDashboardSummary
);

router.get(
  '/analytics/spending-by-category',
  protect,
  AnalyticsController.getSpendingByCategory
);

router.get(
  '/analytics/top-spending-categories',
  protect,
  AnalyticsController.getTopSpendingCategories
);

router.get(
  '/analytics/monthly-comparison',
  protect,
  AnalyticsController.getMonthlyComparison
);

router.get(
  '/analytics/financial-score',
  protect,
  AnalyticsController.getFinancialScore
);

router.get(
  '/analytics/net-worth',
  protect,
  AnalyticsController.getNetWorth
);

router.get(
  '/analytics/cashflow',
  protect,
  AnalyticsController.getCashflowAnalysis
);

/**
 * Sync Routes
 */
router.post(
  '/sync/pull',
  protect,
  SyncController.pullSync
);

router.post(
  '/sync/push',
  protect,
  SyncController.pushSync
);

router.get(
  '/sync/status',
  protect,
  SyncController.getSyncStatus
);

/**
 * Notification Routes
 */
router.post(
  '/notifications/test',
  protect,
  validate(TestNotificationSchema),
  NotificationController.sendTestNotification
);

router.put(
  '/notifications/settings',
  protect,
  validate(NotificationSettingsSchema),
  NotificationController.updateNotificationSettings
);

// Admin routes for sending notifications (would require admin middleware)
router.post(
  '/notifications/budget-alerts',
  NotificationController.sendBudgetAlerts
);

router.post(
  '/notifications/goal-reminders',
  NotificationController.sendGoalReminders
);

router.post(
  '/notifications/bill-reminders',
  NotificationController.sendBillReminders
);

/**
 * Import/Export Routes
 */
router.post(
  '/import/transactions',
  protect,
  uploadImport.single('file'),
  ImportExportController.importTransactions
);

router.get(
  '/export/transactions',
  protect,
  ImportExportController.exportTransactions
);

router.get(
  '/export/data',
  protect,
  ImportExportController.exportData
);

/**
 * Health Check Route
 */
router.get(
  '/health',
  HealthController.getHealthStatus
);

export default router;
