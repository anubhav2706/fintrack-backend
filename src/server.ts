import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import { app, initializeApp } from './app';
import { env } from './config/env';
import { logger } from './config/env';

/**
 * Server Entry Point
 * Starts the Express server and handles server lifecycle
 */

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize the application
    await initializeApp();

    // Start the server
    const server = app.listen(env.PORT, env.HOST, () => {
      logger.info(`🚀 Server is running on ${env.HOST}:${env.PORT}`);
      logger.info(`📚 API Documentation: http://${env.HOST}:${env.PORT}/api-docs`);
      logger.info(`🏥 Health Check: http://${env.HOST}:${env.PORT}/api/health`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      
      if (env.NODE_ENV === 'development') {
        logger.info(`🔧 Development mode - Hot reload enabled`);
        logger.info(`📊 Debug logs enabled`);
      }
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof env.PORT === 'string' 
        ? 'Pipe ' + env.PORT 
        : 'Port ' + env.PORT;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle process signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this is the main module
if (require.main === module) {
  startServer();
}

export { startServer };

export default startServer;
