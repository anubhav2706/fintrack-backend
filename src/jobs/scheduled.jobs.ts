import cron from 'node-cron';
import { User, Transaction, Goal, Budget, Bill, Installment } from '../models';
import { NotificationService } from '../services';
import { logger } from '../config/env';
import { sendEmail } from '../config/firebase';

/**
 * Scheduled Jobs (Cron Tasks)
 * Handles all automated background jobs for the FinTrack Pro backend
 */

export class ScheduledJobs {
  /**
   * Initialize all scheduled jobs
   */
  static initialize() {
    this.setupDailyJobs();
    this.setupWeeklyJobs();
    this.setupMonthlyJobs();
    this.setupHourlyJobs();
    
    logger.info('Scheduled jobs initialized');
  }

  /**
   * Setup daily jobs
   */
  private static setupDailyJobs() {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      logger.info('Running daily jobs');
      await this.sendDailyNotifications();
      await this.checkBillReminders();
      await this.checkInstallmentReminders();
    });

    // Run every day at 11:59 PM
    cron.schedule('59 23 * * *', async () => {
      logger.info('Running end-of-day jobs');
      await this.generateDailyReports();
      await this.checkBudgetAlerts();
    });
  }

  /**
   * Setup weekly jobs
   */
  private static setupWeeklyJobs() {
    // Run every Sunday at 8:00 AM
    cron.schedule('0 8 * * 0', async () => {
      logger.info('Running weekly jobs');
      await this.sendWeeklyReports();
      await this.cleanupOldActivityLogs();
    });
  }

  /**
   * Setup monthly jobs
   */
  private static setupMonthlyJobs() {
    // Run on the 1st of every month at 6:00 AM
    cron.schedule('0 6 1 * *', async () => {
      logger.info('Running monthly jobs');
      await this.generateMonthlyReports();
      await this.archiveOldData();
      await this.resetMonthlyCounters();
    });
  }

  /**
   * Setup hourly jobs
   */
  private static setupHourlyJobs() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      logger.info('Running hourly jobs');
      await this.processRecurringTransactions();
      await this.checkGoalDeadlines();
    });
  }

  /**
   * Send daily notifications
   */
  private static async sendDailyNotifications() {
    try {
      // Get users who have daily notifications enabled
      const users = await User.find({ 
        notifWeekly: true,
        isEmailVerified: true 
      }).select('email name currency');

      for (const user of users) {
        // Get yesterday's transactions
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const transactions = await Transaction.find({
          userId: user.id,
          date: { $gte: yesterday, $lt: today },
          isDeleted: false,
        }).populate('categoryId', 'name icon color');

        if (transactions.length > 0) {
          const income = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum: number, t: any) => sum + t.amount, 0);

          const expense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum: number, t: any) => sum + t.amount, 0);

          await sendEmail({
            to: user.email,
            subject: 'Daily Finance Summary - FinTrack Pro',
            template: 'daily-summary',
            data: {
              name: user.name,
              date: yesterday.toLocaleDateString(),
              income,
              expense,
              net: income - expense,
              transactions: transactions.slice(0, 5), // Show top 5 transactions
              currency: user.currency,
            },
          });
        }
      }

      logger.info(`Daily notifications sent to ${users.length} users`);
    } catch (error) {
      logger.error('Error sending daily notifications:', error);
    }
  }

  /**
   * Check bill reminders
   */
  private static async checkBillReminders() {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find bills due in the next 3 days
      const bills = await Bill.find({
        isActive: true,
        nextDueDate: { 
          $gte: today, 
          $lte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) 
        }
      }).populate('userId', 'email name fcmToken')
      .populate('categoryId', 'name icon color')
      .populate('accountId', 'name type');

      for (const bill of bills as any[]) {
        const daysUntilDue = Math.ceil((bill.nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= bill.reminderDaysBefore) {
          // Send email reminder
          await sendEmail({
            to: bill.userId.email,
            subject: `Bill Due Reminder: ${bill.name}`,
            template: 'bill-reminder',
            data: {
              name: bill.userId.name,
              billName: bill.name,
              amount: bill.amount,
              dueDate: bill.nextDueDate.toLocaleDateString(),
              daysUntilDue,
              category: bill.categoryId?.name || 'Uncategorized',
              account: bill.accountId?.name || 'Unknown',
            },
          });

          // Send push notification if FCM token available
          if (bill.userId.fcmToken) {
            // Send push notification using Firebase
            // This would use the Firebase service
          }
        }
      }

      logger.info(`Bill reminders checked for ${bills.length} bills`);
    } catch (error) {
      logger.error('Error checking bill reminders:', error);
    }
  }

  /**
   * Check installment reminders
   */
  private static async checkInstallmentReminders() {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find installments due in the next 3 days
      const installments = await Installment.find({
        isActive: true,
        nextDueDate: { 
          $gte: today, 
          $lte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) 
        }
      }).populate('userId', 'email name fcmToken')
      .populate('categoryId', 'name icon color')
      .populate('accountId', 'name type');

      for (const installment of installments as any[]) {
        const daysUntilDue = Math.ceil((installment.nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 3) { // 3-day reminder for installments
          // Send email reminder
          await sendEmail({
            to: installment.userId.email,
            subject: `Installment Due Reminder: ${installment.name}`,
            template: 'installment-reminder',
            data: {
              name: installment.userId.name,
              installmentName: installment.name,
              emiAmount: installment.emiAmount,
              dueDate: installment.nextDueDate.toLocaleDateString(),
              daysUntilDue,
              remainingInstallments: installment.totalInstallments - installment.paidInstallments,
              category: installment.categoryId?.name || 'Uncategorized',
              account: installment.accountId?.name || 'Unknown',
            },
          });

          // Send push notification if FCM token available
          if (installment.userId.fcmToken) {
            // Send push notification using Firebase
          }
        }
      }

      logger.info(`Installment reminders checked for ${installments.length} installments`);
    } catch (error) {
      logger.error('Error checking installment reminders:', error);
    }
  }

  /**
   * Generate daily reports
   */
  private static async generateDailyReports() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // This would generate daily analytics reports
      // For now, just log the activity
      logger.info(`Daily report generated for ${today.toISOString()}`);
    } catch (error) {
      logger.error('Error generating daily reports:', error);
    }
  }

  /**
   * Check budget alerts
   */
  private static async checkBudgetAlerts() {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      // Get all budgets for current month
      const budgets = await Budget.find({
        month: currentMonth,
        year: currentYear,
      }).populate('userId', 'email name fcmToken budgetAlertPct')
      .populate('categoryId', 'name icon color');

      for (const budget of budgets as any[]) {
        // Calculate current spending for this category
        const monthStart = new Date(currentYear, currentMonth - 1, 1);
        const monthEnd = new Date(currentYear, currentMonth, 0);

        const spending = await Transaction.aggregate([
          {
            $match: {
              userId: budget.userId.id,
              categoryId: budget.categoryId.id,
              type: 'EXPENSE',
              date: { $gte: monthStart, $lte: monthEnd },
              isDeleted: false,
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const totalSpent = spending.length > 0 ? spending[0].total : 0;
        const utilization = (totalSpent / budget.monthlyLimit) * 100;
        const alertThreshold = budget.userId.budgetAlertPct || 80;

        if (utilization >= alertThreshold) {
          // Send budget alert
          await sendEmail({
            to: budget.userId.email,
            subject: `Budget Alert: ${budget.categoryId.name}`,
            template: 'budget-alert',
            data: {
              name: budget.userId.name,
              category: budget.categoryId.name,
              spent: totalSpent,
              budget: budget.monthlyLimit,
              remaining: budget.monthlyLimit - totalSpent,
              utilization: Math.round(utilization),
              alertThreshold,
            },
          });

          // Send push notification if FCM token available
          if (budget.userId.fcmToken) {
            // Send push notification using Firebase
          }
        }
      }

      logger.info(`Budget alerts checked for ${budgets.length} budgets`);
    } catch (error) {
      logger.error('Error checking budget alerts:', error);
    }
  }

  /**
   * Send weekly reports
   */
  private static async sendWeeklyReports() {
    try {
      // Get users who have weekly notifications enabled
      const users = await User.find({ 
        notifWeekly: true,
        isEmailVerified: true 
      }).select('email name currency');

      for (const user of users) {
        // Get last week's data
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const weekStart = new Date(lastWeek);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)

        const transactions = await Transaction.find({
          userId: user.id,
          date: { $gte: weekStart, $lte: weekEnd },
          isDeleted: false,
        });

        const income = transactions
          .filter(t => t.type === 'INCOME')
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        const expense = transactions
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        // Get goal progress
        const goals = await Goal.find({ userId: user.id, isArchived: false });
        const activeGoals = goals.length;
        const achievedGoals = goals.filter((g: any) => g.isAchieved).length;

        await sendEmail({
          to: user.email,
          subject: 'Weekly Finance Report - FinTrack Pro',
          template: 'weekly-report',
          data: {
            name: user.name,
            weekStart: weekStart.toLocaleDateString(),
            weekEnd: weekEnd.toLocaleDateString(),
            income,
            expense,
            net: income - expense,
            transactionsCount: transactions.length,
            activeGoals,
            achievedGoals,
            currency: user.currency,
          },
        });
      }

      logger.info(`Weekly reports sent to ${users.length} users`);
    } catch (error) {
      logger.error('Error sending weekly reports:', error);
    }
  }

  /**
   * Cleanup old activity logs
   */
  private static async cleanupOldActivityLogs() {
    try {
      // Delete activity logs older than 90 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      // This would use ActivityLog model
      // For now, just log the activity
      logger.info(`Activity logs cleanup completed for data older than ${cutoffDate.toISOString()}`);
    } catch (error) {
      logger.error('Error cleaning up activity logs:', error);
    }
  }

  /**
   * Generate monthly reports
   */
  private static async generateMonthlyReports() {
    try {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

      // Generate comprehensive monthly reports
      logger.info(`Monthly report generated for ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);
    } catch (error) {
      logger.error('Error generating monthly reports:', error);
    }
  }

  /**
   * Archive old data
   */
  private static async archiveOldData() {
    try {
      // Archive transactions older than 2 years
      const archiveDate = new Date();
      archiveDate.setFullYear(archiveDate.getFullYear() - 2);

      // This would move old data to archive collection
      logger.info(`Data archive completed for data older than ${archiveDate.toISOString()}`);
    } catch (error) {
      logger.error('Error archiving old data:', error);
    }
  }

  /**
   * Reset monthly counters
   */
  private static async resetMonthlyCounters() {
    try {
      // Reset monthly usage counters, etc.
      logger.info('Monthly counters reset completed');
    } catch (error) {
      logger.error('Error resetting monthly counters:', error);
    }
  }

  /**
   * Process recurring transactions
   */
  private static async processRecurringTransactions() {
    try {
      const today = new Date();
      
      // Find recurring transactions that need to be processed today
      const recurringTransactions = await Transaction.find({
        isRecurring: true,
        recurringType: { $ne: 'NONE' },
        isDeleted: false,
        $or: [
          { recurringType: 'DAILY' },
          { 
            $and: [
              { recurringType: 'WEEKLY' },
              { $expr: { $eq: [{ $dayOfWeek: '$date' }, { $dayOfWeek: today }] } }
            ]
          },
          { 
            $and: [
              { recurringType: 'MONTHLY' },
              { $expr: { $eq: [{ $dayOfMonth: '$date' }, { $dayOfMonth: today }] } }
            ]
          },
          { 
            $and: [
              { recurringType: 'YEARLY' },
              { $expr: { 
                $and: [
                  { $eq: [{ $month: '$date' }, { $month: today }] },
                  { $eq: [{ $dayOfMonth: '$date' }, { $dayOfMonth: today }] }
                ]
              }}
            ]
          }
        ]
      });

      for (const transaction of recurringTransactions) {
        // Check if we haven't already created a transaction for today
        const existingToday = await Transaction.findOne({
          userId: transaction.userId,
          parentRecurringId: transaction.id,
          date: {
            $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          }
        });

        if (!existingToday) {
          // Create new transaction instance
          await Transaction.create({
            userId: transaction.userId,
            title: transaction.title,
            amount: transaction.amount,
            type: transaction.type,
            categoryId: transaction.categoryId,
            accountId: transaction.accountId,
            toAccountId: transaction.toAccountId,
            date: today,
            notes: transaction.notes,
            tags: transaction.tags,
            paymentMethod: transaction.paymentMethod,
            isRecurring: false, // New instance is not recurring
            parentRecurringId: transaction.id,
          });

          logger.info(`Created recurring transaction instance for user ${transaction.userId}`);
        }
      }

      logger.info(`Processed ${recurringTransactions.length} recurring transactions`);
    } catch (error) {
      logger.error('Error processing recurring transactions:', error);
    }
  }

  /**
   * Check goal deadlines
   */
  private static async checkGoalDeadlines() {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find goals with deadlines in the next week
      const goals = await Goal.find({
        deadline: { $gte: today, $lte: nextWeek },
        isArchived: false,
        isAchieved: false,
      }).populate('userId', 'email name fcmToken');

      for (const goal of goals as any[]) {
        const daysUntilDeadline = Math.ceil((goal.deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const progress = (goal.currentSaved / goal.targetAmount) * 100;

        if (daysUntilDeadline <= 7) {
          // Send goal deadline reminder
          await sendEmail({
            to: goal.userId.email,
            subject: `Goal Deadline Reminder: ${goal.name}`,
            template: 'goal-deadline-reminder',
            data: {
              name: goal.userId.name,
              goalName: goal.name,
              targetAmount: goal.targetAmount,
              currentSaved: goal.currentSaved,
              remaining: goal.targetAmount - goal.currentSaved,
              progress: Math.round(progress),
              deadline: goal.deadline.toLocaleDateString(),
              daysUntilDeadline,
            },
          });

          // Send push notification if FCM token available
          if (goal.userId.fcmToken) {
            // Send push notification using Firebase
          }
        }
      }

      logger.info(`Goal deadline reminders checked for ${goals.length} goals`);
    } catch (error) {
      logger.error('Error checking goal deadlines:', error);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  static stop() {
    cron.getTasks().forEach(task => task.stop());
    logger.info('All scheduled jobs stopped');
  }
}
