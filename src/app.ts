import express from 'express';
import { connectDB } from './config/database';
import { initializeFirebase } from './config/firebase';
import { ScheduledJobs } from './jobs';
import { specs, swaggerUi, swaggerUiOptions } from './config/swagger';
import { errorHandler, notFound, requestTimeout, healthCheck } from './middleware';
import { logger } from './config/env';
import routes from './routes';

/**
 * Express Application Configuration
 * Sets up the main Express app with all middleware and routes
 */

const app = express();

/**
 * Trust proxy for load balancers
 */
app.set('trust proxy', 1);

/**
 * Request timeout middleware
 */
app.use(requestTimeout(30000)); // 30 seconds

/**
 * Health check middleware (before other middleware)
 */
app.use('/api/health', healthCheck);

/**
 * Body parsing middleware
 */
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

/**
 * API Routes
 */
app.use('/api', routes);

/**
 * Swagger Documentation
 */
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(specs, swaggerUiOptions));

/**
 * Serve API specs as JSON
 */
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'FinTrack Pro API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      api: '/api',
      docs: '/api-docs',
      health: '/api/health',
      specs: '/api-docs.json',
    },
    documentation: 'https://docs.fintrackpro.com',
    support: 'support@fintrackpro.com',
  });
});

/**
 * 404 handler
 */
app.use(notFound);

/**
 * Global error handler
 */
app.use(errorHandler);

/**
 * Initialize application
 */
async function initializeApp() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Database connected successfully');

    // Initialize Firebase
    await initializeFirebase();
    logger.info('Firebase initialized successfully');

    // Initialize scheduled jobs
    ScheduledJobs.initialize();
    logger.info('Scheduled jobs initialized');

    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  // Stop scheduled jobs
  ScheduledJobs.stop();

  // Close database connection
  // This would be handled by the database module

  logger.info('Graceful shutdown completed');
  process.exit(0);
}

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize app if this is the main module
if (require.main === module) {
  initializeApp();
}

export { app, initializeApp };

export default app;
