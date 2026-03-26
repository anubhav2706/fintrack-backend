import { Router } from 'express';
import { TransactionController } from '../controllers';
import { validate, protect, fileUploadRateLimit, uploadReceipt } from '../middleware';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionIdParamSchema,
  TransactionQuerySchema,
  BulkDeleteTransactionsSchema,
  SearchMerchantsSchema,
  AccountTransferSchema,
  CreateCommentSchema,
  CommentIdParamSchema,
} from '../schemas';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management and operations
 */

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - amount
 *               - type
 *               - categoryId
 *               - accountId
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *                 description: Transaction title
 *               amount:
 *                 type: number
 *                 positive: true
 *                 description: Transaction amount
 *               type:
 *                 type: string
 *                 enum: [EXPENSE, INCOME, TRANSFER]
 *                 description: Transaction type
 *               categoryId:
 *                 type: string
 *                 description: Category ID
 *               accountId:
 *                 type: string
 *                 description: Account ID
 *               toAccountId:
 *                 type: string
 *                 description: Destination account ID (for transfers)
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Transaction date
 *               notes:
 *                 type: string
 *                 description: Transaction notes
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Transaction tags
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, UPI, DEBIT_CARD, CREDIT_CARD, NET_BANKING, CHEQUE, WALLET, EMI, OTHER]
 *               isRecurring:
 *                 type: boolean
 *               recurringType:
 *                 type: string
 *                 enum: [NONE, DAILY, WEEKLY, MONTHLY, YEARLY]
 *               recurringEndDate:
 *                 type: string
 *                 format: date-time
 *               receiptUrl:
 *                 type: string
 *                 format: uri
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               merchantName:
 *                 type: string
 *               splitGroupId:
 *                 type: string
 *               profileId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  protect,
  validate(CreateTransactionSchema),
  TransactionController.createTransaction
);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get transactions with pagination and filtering
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [EXPENSE, INCOME, TRANSFER]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: isRecurring
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, amount, title, createdAt]
 *           default: date
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [CASH, UPI, DEBIT_CARD, CREDIT_CARD, NET_BANKING, CHEQUE, WALLET, EMI, OTHER]
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  protect,
  validate(TransactionQuerySchema),
  TransactionController.getTransactions
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  protect,
  validate(TransactionIdParamSchema),
  TransactionController.getTransactionById
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               amount:
 *                 type: number
 *                 positive: true
 *               type:
 *                 type: string
 *                 enum: [EXPENSE, INCOME, TRANSFER]
 *               categoryId:
 *                 type: string
 *               accountId:
 *                 type: string
 *               toAccountId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, UPI, DEBIT_CARD, CREDIT_CARD, NET_BANKING, CHEQUE, WALLET, EMI, OTHER]
 *               isRecurring:
 *                 type: boolean
 *               recurringType:
 *                 type: string
 *                 enum: [NONE, DAILY, WEEKLY, MONTHLY, YEARLY]
 *               recurringEndDate:
 *                 type: string
 *                 format: date-time
 *               receiptUrl:
 *                 type: string
 *                 format: uri
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               merchantName:
 *                 type: string
 *               profileId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id',
  protect,
  validate(TransactionIdParamSchema),
  validate(UpdateTransactionSchema),
  TransactionController.updateTransaction
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete transaction (soft delete)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:id',
  protect,
  validate(TransactionIdParamSchema),
  TransactionController.deleteTransaction
);

/**
 * @swagger
 * /api/transactions/bulk:
 *   delete:
 *     summary: Bulk delete transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 100
 *     responses:
 *       200:
 *         description: Transactions deleted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/bulk',
  protect,
  validate(BulkDeleteTransactionsSchema),
  TransactionController.bulkDeleteTransactions
);

/**
 * @swagger
 * /api/transactions/summary:
 *   get:
 *     summary: Get transaction summary
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction summary retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/summary',
  protect,
  TransactionController.getTransactionSummary
);

/**
 * @swagger
 * /api/transactions/merchants/search:
 *   get:
 *     summary: Search merchants
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Merchants retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/merchants/search',
  protect,
  validate(SearchMerchantsSchema),
  TransactionController.searchMerchants
);

/**
 * @swagger
 * /api/transactions/trends/monthly:
 *   get:
 *     summary: Get monthly trends
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           default: 12
 *     responses:
 *       200:
 *         description: Monthly trends retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/trends/monthly',
  protect,
  TransactionController.getMonthlyTrends
);

/**
 * @swagger
 * /api/transactions/tags/stats:
 *   get:
 *     summary: Get tag statistics
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Tag statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/tags/stats',
  protect,
  TransactionController.getTagStats
);

/**
 * @swagger
 * /api/transactions/{id}/comments:
 *   post:
 *     summary: Create transaction comment
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 500
 *               profileId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/comments',
  protect,
  validate(TransactionIdParamSchema),
  validate(CreateCommentSchema),
  TransactionController.createComment
);

/**
 * @swagger
 * /api/transactions/{id}/comments:
 *   get:
 *     summary: Get transaction comments
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id/comments',
  protect,
  validate(TransactionIdParamSchema),
  TransactionController.getComments
);

/**
 * @swagger
 * /api/transactions/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete transaction comment
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:id/comments/:commentId',
  protect,
  validate(CommentIdParamSchema),
  TransactionController.deleteComment
);

/**
 * @swagger
 * /api/accounts/{id}/transfer:
 *   post:
 *     summary: Transfer amount between accounts
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toAccountId
 *               - amount
 *             properties:
 *               toAccountId:
 *                 type: string
 *               amount:
 *                 type: number
 *                 positive: true
 *               date:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transfer completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
// TODO: Implement transferAmount method in TransactionController
// router.post(
//   '/accounts/:id/transfer',
//   protect,
//   validate(AccountTransferSchema),
//   TransactionController.transferAmount
// );

export default router;
