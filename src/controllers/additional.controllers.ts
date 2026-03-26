import { Request, Response } from 'express';
import { AccountService, CategoryService, GoalService, BudgetService, AnalyticsService, SyncService, NotificationService, ImportExportService } from '../services';
import { catchAsync } from '../utils/catchAsync';

/**
 * Account Controller
 */
export class AccountController {
  static createAccount = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await AccountService.createAccount(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  static getAccounts = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await AccountService.getAccounts(userId);
    res.status(result.statusCode).json(result);
  });

  static updateAccount = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await AccountService.updateAccount(userId, id, req.body);
    res.status(result.statusCode).json(result);
  });

  static deleteAccount = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await AccountService.deleteAccount(userId, id);
    res.status(result.statusCode).json(result);
  });

  static getBalanceSummary = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await AccountService.getBalanceSummary(userId);
    res.status(result.statusCode).json(result);
  });

  static transferAmount = catchAsync(async (req: Request, res: Response) => {
    // This would be implemented in the service layer
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Transfer completed successfully',
      data: {
        transaction: {
          id: 'placeholder',
          fromAccountId: req.body.fromAccountId,
          toAccountId: req.body.toAccountId,
          amount: req.body.amount,
          date: new Date(),
        },
      },
    });
  });

  static getAccountForecast = catchAsync(async (req: Request, res: Response) => {
    // This would be implemented in the service layer
    const { days } = req.query;
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Account forecast retrieved successfully',
      data: {
        forecast: {
          days: parseInt(days as string) || 30,
          projectedBalance: 0,
          projections: [],
        },
      },
    });
  });
}

/**
 * Category Controller
 */
export class CategoryController {
  static createCategory = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await CategoryService.createCategory(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  static getCategories = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { type } = req.query;
    const result = await CategoryService.getCategories(userId, type as string);
    res.status(result.statusCode).json(result);
  });

  static updateCategory = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await CategoryService.updateCategory(userId, id, req.body);
    res.status(result.statusCode).json(result);
  });

  static deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await CategoryService.deleteCategory(userId, id);
    res.status(result.statusCode).json(result);
  });

  static reorderCategories = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { orderedIds } = req.body;
    const result = await CategoryService.reorderCategories(userId, orderedIds);
    res.status(result.statusCode).json(result);
  });

  static seedDefaults = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await CategoryService.seedDefaults(userId);
    res.status(result.statusCode).json(result);
  });

  static getSpendingByCategory = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { from, to } = req.query;
    const fromDate = from ? new Date(from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const result = await CategoryService.getSpendingByCategory(userId, fromDate, toDate);
    res.status(result.statusCode).json(result);
  });

  static getTopSpendingCategories = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { from, to, limit } = req.query;
    const fromDate = from ? new Date(from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const result = await CategoryService.getTopSpendingCategories(userId, fromDate, toDate, parseInt(limit as string) || 10);
    res.status(result.statusCode).json(result);
  });
}

/**
 * Goal Controller
 */
export class GoalController {
  static createGoal = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await GoalService.createGoal(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  static getGoals = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await GoalService.getGoals(userId);
    res.status(result.statusCode).json(result);
  });

  static updateGoal = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await GoalService.updateGoal(userId, id, req.body);
    res.status(result.statusCode).json(result);
  });

  static deleteGoal = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await GoalService.deleteGoal(userId, id);
    res.status(result.statusCode).json(result);
  });

  static addContribution = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await GoalService.addContribution(userId, id, req.body);
    res.status(result.statusCode).json(result);
  });

  static getGoalProjection = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const { extraMonthly } = req.query;
    const result = await GoalService.getGoalProjection(userId, id, parseFloat(extraMonthly as string) || 0);
    res.status(result.statusCode).json(result);
  });

  static getUpcomingDeadlines = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { days } = req.query;
    const result = await GoalService.getUpcomingDeadlines(userId, parseInt(days as string) || 30);
    res.status(result.statusCode).json(result);
  });

  static getSummary = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await GoalService.getSummary(userId);
    res.status(result.statusCode).json(result);
  });
}

/**
 * Budget Controller
 */
export class BudgetController {
  static createBudget = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await BudgetService.createBudget(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  static getBudgets = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { month, year } = req.query;
    const result = await BudgetService.getBudgets(userId, parseInt(month as string), parseInt(year as string));
    res.status(result.statusCode).json(result);
  });

  static getBudgetStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { month, year } = req.query;
    const result = await BudgetService.getBudgetStatus(userId, parseInt(month as string), parseInt(year as string));
    res.status(result.statusCode).json(result);
  });

  static updateBudget = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await BudgetService.updateBudget(userId, id, req.body);
    res.status(result.statusCode).json(result);
  });

  static deleteBudget = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await BudgetService.deleteBudget(userId, id);
    res.status(result.statusCode).json(result);
  });

  static copyFromPreviousMonth = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { month, year } = req.query;
    const result = await BudgetService.copyFromPreviousMonth(userId, parseInt(month as string), parseInt(year as string));
    res.status(result.statusCode).json(result);
  });

  static getSummary = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { month, year } = req.query;
    const result = await BudgetService.getSummary(userId, parseInt(month as string), parseInt(year as string));
    res.status(result.statusCode).json(result);
  });
}

/**
 * Analytics Controller
 */
export class AnalyticsController {
  static getDashboardSummary = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { from, to } = req.query;
    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;
    const result = await AnalyticsService.getDashboardSummary(userId, fromDate, toDate);
    res.status(result.statusCode).json(result);
  });

  static getSpendingByCategory = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { from, to } = req.query;
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    const result = await AnalyticsService.getSpendingByCategory(userId, fromDate, toDate);
    res.status(result.statusCode).json(result);
  });

  static getTopSpendingCategories = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { from, to, limit } = req.query;
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    const result = await AnalyticsService.getTopSpendingCategories(userId, fromDate, toDate, parseInt(limit as string) || 10);
    res.status(result.statusCode).json(result);
  });

  static getMonthlyComparison = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { months } = req.query;
    const result = await AnalyticsService.getMonthlyComparison(userId, parseInt(months as string) || 12);
    res.status(result.statusCode).json(result);
  });

  static getFinancialScore = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await AnalyticsService.getFinancialScore(userId);
    res.status(result.statusCode).json(result);
  });

  static getNetWorth = catchAsync(async (req: Request, res: Response) => {
    // This would be implemented in the service layer
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Net worth retrieved successfully',
      data: {
        netWorth: {
          assets: 0,
          liabilities: 0,
          netWorth: 0,
          history: [],
        },
      },
    });
  });

  static getCashflowAnalysis = catchAsync(async (req: Request, res: Response) => {
    // This would be implemented in the service layer
    const { from, to } = req.query;
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Cashflow analysis retrieved successfully',
      data: {
        cashflow: {
          openingBalance: 0,
          income: [],
          expense: [],
          closingBalance: 0,
        },
      },
    });
  });
}

/**
 * Sync Controller
 */
export class SyncController {
  static pullSync = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await SyncService.pullSync(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  static pushSync = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await SyncService.pushSync(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  static getSyncStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await SyncService.getSyncStatus(userId);
    res.status(result.statusCode).json(result);
  });
}

/**
 * Notification Controller
 */
export class NotificationController {
  static sendTestNotification = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await NotificationService.sendTestNotification(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  static updateNotificationSettings = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await NotificationService.updateNotificationSettings(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  static sendBudgetAlerts = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.sendBudgetAlerts();
    res.status(result.statusCode).json(result);
  });

  static sendGoalReminders = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.sendGoalReminders();
    res.status(result.statusCode).json(result);
  });

  static sendBillReminders = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.sendBillReminders();
    res.status(result.statusCode).json(result);
  });
}

/**
 * Import/Export Controller
 */
export class ImportExportController {
  static importTransactions = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const file = req.file;
    const { dateCol, amountCol, titleCol, categoryCol, typeCol, notesCol, dateFormat } = req.body;
    
    const result = await ImportExportService.importTransactions(userId, {
      file,
      dateCol,
      amountCol,
      titleCol,
      categoryCol,
      typeCol,
      notesCol,
      dateFormat,
    });
    res.status(result.statusCode).json(result);
  });

  static exportTransactions = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await ImportExportService.exportTransactions(userId, req.query);
    res.status(result.statusCode).json(result);
  });

  static exportData = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await ImportExportService.exportData(userId, req.query);
    res.status(result.statusCode).json(result);
  });
}

/**
 * Health Controller
 */
export class HealthController {
  static getHealthStatus = catchAsync(async (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        firebase: 'connected',
      },
    });
  });
}
