import { Request, Response } from 'express';
import { TransactionService } from '../services';
import { catchAsync } from '../utils/catchAsync';

/**
 * Transaction Controller
 * Thin wrapper around TransactionService methods
 */

export class TransactionController {
  /**
   * Create a new transaction
   * @route POST /api/transactions
   */
  static createTransaction = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await TransactionService.createTransaction(userId, req.body);
    res.status(result.statusCode).json(result);
  });

  /**
   * Get transactions with pagination and filtering
   * @route GET /api/transactions
   */
  static getTransactions = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await TransactionService.getTransactions(userId, req.query);
    res.status(result.statusCode).json(result);
  });

  /**
   * Get transaction by ID
   * @route GET /api/transactions/:id
   */
  static getTransactionById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await TransactionService.getTransactionById(userId, id);
    res.status(result.statusCode).json(result);
  });

  /**
   * Update transaction
   * @route PUT /api/transactions/:id
   */
  static updateTransaction = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await TransactionService.updateTransaction(userId, id, req.body);
    res.status(result.statusCode).json(result);
  });

  /**
   * Delete transaction (soft delete)
   * @route DELETE /api/transactions/:id
   */
  static deleteTransaction = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await TransactionService.deleteTransaction(userId, id);
    res.status(result.statusCode).json(result);
  });

  /**
   * Bulk delete transactions
   * @route DELETE /api/transactions/bulk
   */
  static bulkDeleteTransactions = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { ids } = req.body;
    const result = await TransactionService.bulkDeleteTransactions(userId, ids);
    res.status(result.statusCode).json(result);
  });

  /**
   * Get transaction summary
   * @route GET /api/transactions/summary
   */
  static getTransactionSummary = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { from, to, accountId } = req.query;
    
    const fromDate = from ? new Date(from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    const result = await TransactionService.getTransactionSummary(userId, fromDate, toDate, accountId as string);
    res.status(result.statusCode).json(result);
  });

  /**
   * Search merchants
   * @route GET /api/transactions/merchants/search
   */
  static searchMerchants = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { q, limit } = req.query;
    const result = await TransactionService.searchMerchants(userId, q as string, parseInt(limit as string) || 10);
    res.status(result.statusCode).json(result);
  });

  /**
   * Get monthly trends
   * @route GET /api/transactions/trends/monthly
   */
  static getMonthlyTrends = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { months } = req.query;
    const result = await TransactionService.getMonthlyTrends(userId, parseInt(months as string) || 12);
    res.status(result.statusCode).json(result);
  });

  /**
   * Get tag statistics
   * @route GET /api/transactions/tags/stats
   */
  static getTagStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { limit } = req.query;
    const result = await TransactionService.getTagStats(userId, parseInt(limit as string) || 20);
    res.status(result.statusCode).json(result);
  });

  /**
   * Create transaction comment
   * @route POST /api/transactions/:id/comments
   */
  static createComment = catchAsync(async (req: Request, res: Response) => {
    // This would be implemented in the service layer
    // For now, returning a placeholder response
    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Comment created successfully',
      data: {
        comment: {
          id: 'placeholder',
          text: req.body.text,
          createdAt: new Date(),
        },
      },
    });
  });

  /**
   * Get transaction comments
   * @route GET /api/transactions/:id/comments
   */
  static getComments = catchAsync(async (req: Request, res: Response) => {
    // This would be implemented in the service layer
    // For now, returning a placeholder response
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Comments retrieved successfully',
      data: {
        comments: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      },
    });
  });

  /**
   * Delete transaction comment
   * @route DELETE /api/transactions/:id/comments/:commentId
   */
  static deleteComment = catchAsync(async (req: Request, res: Response) => {
    // This would be implemented in the service layer
    // For now, returning a placeholder response
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Comment deleted successfully',
    });
  });
}
