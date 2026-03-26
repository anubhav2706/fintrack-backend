import mongoose from 'mongoose';
import { Transaction, Account, Category, User } from '../models';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';
import { logger } from '../config/env';
import { paginate } from '../utils/paginate';

/**
 * Transaction Service
 * Handles all transaction-related business logic
 */

export class TransactionService {
  /**
   * Create a new transaction
   */
  static createTransaction = catchAsync(async (userId: string, transactionData: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        title,
        amount,
        type,
        categoryId,
        accountId,
        toAccountId,
        date,
        notes,
        tags,
        paymentMethod,
        isRecurring,
        recurringType,
        recurringEndDate,
        receiptUrl,
        latitude,
        longitude,
        merchantName,
        splitGroupId,
        profileId,
      } = transactionData;

      // Validate account and category
      const account = await Account.findOne({ _id: accountId, userId }).session(session);
      if (!account) {
        throw ApiError.notFound('Account not found');
      }

      const category = await Category.findOne({ _id: categoryId, userId }).session(session);
      if (!category) {
        throw ApiError.notFound('Category not found');
      }

      // Validate transfer transaction
      if (type === 'TRANSFER') {
        if (!toAccountId) {
          throw ApiError.badRequest('Transfer transactions must have a destination account');
        }

        const toAccount = await Account.findOne({ _id: toAccountId, userId }).session(session);
        if (!toAccount) {
          throw ApiError.notFound('Destination account not found');
        }

        if (accountId === toAccountId) {
          throw ApiError.badRequest('Source and destination accounts cannot be the same');
        }
      }

      // Create transaction
      const transaction = await Transaction.create([{
        userId,
        title: title.trim(),
        amount,
        type,
        categoryId,
        accountId,
        toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
        date: new Date(date),
        notes: notes?.trim(),
        tags: tags || [],
        paymentMethod,
        isRecurring: isRecurring || false,
        recurringType: isRecurring ? recurringType : 'NONE',
        recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : undefined,
        receiptUrl,
        latitude,
        longitude,
        merchantName: merchantName?.trim(),
        splitGroupId,
        profileId,
      }], { session });

      const createdTransaction = transaction[0];

      // Update account balances
      if (type === 'INCOME') {
        account.balance += amount;
        await account.save({ session });
      } else if (type === 'EXPENSE') {
        account.balance -= amount;
        await account.save({ session });
      } else if (type === 'TRANSFER') {
        account.balance -= amount;
        await account.save({ session });

        const toAccount = await Account.findById(toAccountId).session(session);
        if (toAccount) {
          toAccount.balance += amount;
          await toAccount.save({ session });
        }
      }

      await session.commitTransaction();

      // Populate related data
      const populatedTransaction = await Transaction.findById(createdTransaction.id)
        .populate('categoryId', 'name icon color type')
        .populate('accountId', 'name type currency color icon')
        .populate('toAccountId', 'name type currency color icon')
        .populate('profileId', 'name avatarColor');

      // Log activity
      logger.info('Transaction created', { 
        userId, 
        transactionId: createdTransaction.id, 
        type, 
        amount 
      });

      return ApiResponse.created('Transaction created successfully', {
        transaction: populatedTransaction,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  });

  /**
   * Get transactions with pagination and filtering
   */
  static getTransactions = catchAsync(async (userId: string, options: any = {}) => {
    const {
      page = 1,
      limit = 20,
      from,
      to,
      type,
      categoryId,
      accountId,
      tags,
      search,
      minAmount,
      maxAmount,
      isRecurring,
      sortBy = 'date',
      sortOrder = 'desc',
      paymentMethod,
    } = options;

    // Build query
    const query: any = {
      userId,
      isDeleted: false,
    };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    if (type) query.type = type;
    if (categoryId) query.categoryId = new mongoose.Types.ObjectId(categoryId);
    if (accountId) query.accountId = new mongoose.Types.ObjectId(accountId);
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }
    if (search) {
      query.$text = { $search: search };
    }
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }
    if (isRecurring !== undefined) query.isRecurring = isRecurring;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .populate('categoryId', 'name icon color type')
      .populate('accountId', 'name type currency color icon')
      .populate('toAccountId', 'name type currency color icon')
      .populate('profileId', 'name avatarColor')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get total count
    const total = await Transaction.countDocuments(query);

    return ApiResponse.success('Transactions retrieved successfully', {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  });

  /**
   * Get transaction by ID
   */
  static getTransactionById = catchAsync(async (userId: string, transactionId: string) => {
    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId,
      isDeleted: false,
    })
      .populate('categoryId', 'name icon color type')
      .populate('accountId', 'name type currency color icon')
      .populate('toAccountId', 'name type currency color icon')
      .populate('profileId', 'name avatarColor')
      .populate('parentRecurringId', 'title date');

    if (!transaction) {
      throw ApiError.notFound('Transaction not found');
    }

    return ApiResponse.success('Transaction retrieved successfully', {
      transaction,
    });
  });

  /**
   * Update transaction
   */
  static updateTransaction = catchAsync(async (userId: string, transactionId: string, updateData: any) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existingTransaction = await Transaction.findOne({
        _id: transactionId,
        userId,
        isDeleted: false,
      }).session(session);

      if (!existingTransaction) {
        throw ApiError.notFound('Transaction not found');
      }

      const {
        title,
        amount,
        type,
        categoryId,
        accountId,
        toAccountId,
        date,
        notes,
        tags,
        paymentMethod,
        isRecurring,
        recurringType,
        recurringEndDate,
        receiptUrl,
        latitude,
        longitude,
        merchantName,
        profileId,
      } = updateData;

      // Validate account and category if provided
      if (categoryId) {
        const category = await Category.findOne({ _id: categoryId, userId }).session(session);
        if (!category) {
          throw ApiError.notFound('Category not found');
        }
      }

      if (accountId) {
        const account = await Account.findOne({ _id: accountId, userId }).session(session);
        if (!account) {
          throw ApiError.notFound('Account not found');
        }
      }

      // Validate transfer changes
      if (type === 'TRANSFER' && !toAccountId) {
        throw ApiError.badRequest('Transfer transactions must have a destination account');
      }

      // Calculate balance changes
      const oldAmount = existingTransaction.amount;
      const oldType = existingTransaction.type;
      const oldAccountId = existingTransaction.accountId;
      const oldToAccountId = existingTransaction.toAccountId;

      // Revert old transaction effect on balances
      if (oldType === 'INCOME') {
        const oldAccount = await Account.findById(oldAccountId).session(session);
        if (oldAccount) {
          oldAccount.balance -= oldAmount;
          await oldAccount.save({ session });
        }
      } else if (oldType === 'EXPENSE') {
        const oldAccount = await Account.findById(oldAccountId).session(session);
        if (oldAccount) {
          oldAccount.balance += oldAmount;
          await oldAccount.save({ session });
        }
      } else if (oldType === 'TRANSFER') {
        const oldAccount = await Account.findById(oldAccountId).session(session);
        if (oldAccount) {
          oldAccount.balance += oldAmount;
          await oldAccount.save({ session });
        }

        if (oldToAccountId) {
          const oldToAccount = await Account.findById(oldToAccountId).session(session);
          if (oldToAccount) {
            oldToAccount.balance -= oldAmount;
            await oldToAccount.save({ session });
          }
        }
      }

      // Update transaction
      const updatedTransaction = await Transaction.findByIdAndUpdate(
        transactionId,
        {
          title: title?.trim(),
          amount,
          type,
          categoryId,
          accountId,
          toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
          date: date ? new Date(date) : existingTransaction.date,
          notes: notes?.trim(),
          tags: tags || [],
          paymentMethod,
          isRecurring: isRecurring !== undefined ? isRecurring : existingTransaction.isRecurring,
          recurringType: isRecurring ? recurringType : 'NONE',
          recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : undefined,
          receiptUrl,
          latitude,
          longitude,
          merchantName: merchantName?.trim(),
          profileId,
        },
        { new: true, session }
      );

      // Apply new transaction effect on balances
      if (type === 'INCOME') {
        const newAccount = await Account.findById(accountId).session(session);
        if (newAccount) {
          newAccount.balance += amount;
          await newAccount.save({ session });
        }
      } else if (type === 'EXPENSE') {
        const newAccount = await Account.findById(accountId).session(session);
        if (newAccount) {
          newAccount.balance -= amount;
          await newAccount.save({ session });
        }
      } else if (type === 'TRANSFER') {
        const newAccount = await Account.findById(accountId).session(session);
        if (newAccount) {
          newAccount.balance -= amount;
          await newAccount.save({ session });
        }

        if (toAccountId) {
          const newToAccount = await Account.findById(toAccountId).session(session);
          if (newToAccount) {
            newToAccount.balance += amount;
            await newToAccount.save({ session });
          }
        }
      }

      await session.commitTransaction();

      // Populate related data
      const populatedTransaction = await Transaction.findById(updatedTransaction.id)
        .populate('categoryId', 'name icon color type')
        .populate('accountId', 'name type currency color icon')
        .populate('toAccountId', 'name type currency color icon')
        .populate('profileId', 'name avatarColor');

      // Log activity
      logger.info('Transaction updated', { 
        userId, 
        transactionId, 
        changes: updateData 
      });

      return ApiResponse.success('Transaction updated successfully', {
        transaction: populatedTransaction,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  });

  /**
   * Delete transaction (soft delete)
   */
  static deleteTransaction = catchAsync(async (userId: string, transactionId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId,
        isDeleted: false,
      }).session(session);

      if (!transaction) {
        throw ApiError.notFound('Transaction not found');
      }

      // Revert transaction effect on balances
      if (transaction.type === 'INCOME') {
        const account = await Account.findById(transaction.accountId).session(session);
        if (account) {
          account.balance -= transaction.amount;
          await account.save({ session });
        }
      } else if (transaction.type === 'EXPENSE') {
        const account = await Account.findById(transaction.accountId).session(session);
        if (account) {
          account.balance += transaction.amount;
          await account.save({ session });
        }
      } else if (transaction.type === 'TRANSFER') {
        const account = await Account.findById(transaction.accountId).session(session);
        if (account) {
          account.balance += transaction.amount;
          await account.save({ session });
        }

        if (transaction.toAccountId) {
          const toAccount = await Account.findById(transaction.toAccountId).session(session);
          if (toAccount) {
            toAccount.balance -= transaction.amount;
            await toAccount.save({ session });
          }
        }
      }

      // Soft delete transaction
      transaction.isDeleted = true;
      transaction.deletedAt = new Date();
      await transaction.save({ session });

      await session.commitTransaction();

      // Log activity
      logger.info('Transaction deleted', { 
        userId, 
        transactionId, 
        type: transaction.type, 
        amount: transaction.amount 
      });

      return ApiResponse.success('Transaction deleted successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  });

  /**
   * Bulk delete transactions
   */
  static bulkDeleteTransactions = catchAsync(async (userId: string, transactionIds: string[]) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find transactions to delete
      const transactions = await Transaction.find({
        _id: { $in: transactionIds },
        userId,
        isDeleted: false,
      }).session(session);

      if (transactions.length === 0) {
        throw ApiError.notFound('No transactions found to delete');
      }

      // Revert all transaction effects on balances
      for (const transaction of transactions) {
        if (transaction.type === 'INCOME') {
          const account = await Account.findById(transaction.accountId).session(session);
          if (account) {
            account.balance -= transaction.amount;
            await account.save({ session });
          }
        } else if (transaction.type === 'EXPENSE') {
          const account = await Account.findById(transaction.accountId).session(session);
          if (account) {
            account.balance += transaction.amount;
            await account.save({ session });
          }
        } else if (transaction.type === 'TRANSFER') {
          const account = await Account.findById(transaction.accountId).session(session);
          if (account) {
            account.balance += transaction.amount;
            await account.save({ session });
          }

          if (transaction.toAccountId) {
            const toAccount = await Account.findById(transaction.toAccountId).session(session);
            if (toAccount) {
              toAccount.balance -= transaction.amount;
              await toAccount.save({ session });
            }
          }
        }

        // Soft delete transaction
        transaction.isDeleted = true;
        transaction.deletedAt = new Date();
        await transaction.save({ session });
      }

      await session.commitTransaction();

      // Log activity
      logger.info('Bulk transactions deleted', { 
        userId, 
        count: transactions.length 
      });

      return ApiResponse.success(`${transactions.length} transactions deleted successfully`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  });

  /**
   * Get transaction summary
   */
  static getTransactionSummary = catchAsync(async (userId: string, from: Date, to: Date, accountId?: string) => {
    const summary = await Transaction.getSummary(userId, from, to, accountId);

    return ApiResponse.success('Transaction summary retrieved successfully', {
      summary: summary[0] || {
        income: 0,
        expense: 0,
        net: 0,
        count: 0,
      },
    });
  });

  /**
   * Search merchants
   */
  static searchMerchants = catchAsync(async (userId: string, query: string, limit: number = 10) => {
    const merchants = await Transaction.searchMerchants(userId, query, limit);

    return ApiResponse.success('Merchants retrieved successfully', {
      merchants,
    });
  });

  /**
   * Get monthly trends
   */
  static getMonthlyTrends = catchAsync(async (userId: string, months: number = 12) => {
    const trends = await Transaction.getMonthlyTrends(userId, months);

    return ApiResponse.success('Monthly trends retrieved successfully', {
      trends,
    });
  });

  /**
   * Get tag statistics
   */
  static getTagStats = catchAsync(async (userId: string, limit: number = 20) => {
    const stats = await Transaction.getTagStats(userId, limit);

    return ApiResponse.success('Tag statistics retrieved successfully', {
      stats,
    });
  });
}
