import { Router } from 'express';
import { generalRateLimit, corsMiddleware, requestLogger, securityHeaders } from '../middleware';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';
import additionalRoutes from './additional.routes';
import syncRoutes from './sync.routes';

const router = Router();

/**
 * Apply global middleware
 */
router.use(corsMiddleware);
router.use(securityHeaders);
router.use(requestLogger);
router.use(generalRateLimit);

/**
 * @swagger
 * tags:
 *   name: API
 *   description: FinTrack Pro Backend API
 */

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API Welcome Message
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Welcome to FinTrack Pro API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome to FinTrack Pro API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 status:
 *                   type: string
 *                   example: operational
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FinTrack Pro API',
    version: '1.0.0',
    status: 'operational',
    documentation: '/api/docs',
    health: '/api/health',
  });
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/sync', syncRoutes);
router.use('/', additionalRoutes);

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: API Documentation
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Redirect to Swagger UI
 *         content:
 *           text/html:
 *             example: Redirecting to Swagger UI...
 */
router.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

export default router;
