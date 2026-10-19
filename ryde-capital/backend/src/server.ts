import { app } from './app.js';
import { env } from './config/env.js';
import { createLogger } from '@ryde/shared';
import { startBackgroundJobs } from './jobs/index.js';
import { matchingWorker } from './modules/matching/index.js';

const logger = createLogger({ serviceName: 'ryde-capital-backend' });

const port = env.PORT;

const server = app.listen(port, () => {
  logger.info(`🚀 Ryde Capital Backend running on port ${port} in ${env.NODE_ENV} mode`);
  // Start background jobs & matching engine
  startBackgroundJobs();
  matchingWorker.start(3000);
});

// Graceful shutdown handling
function shutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  matchingWorker.stop();

  server.close(() => {
    logger.info('HTTP server closed successfully.');
    process.exit(0);
  });

  // Force shutdown after 10s timeout
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', reason => {
  logger.error({ reason }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', error => {
  logger.fatal({ error }, 'Uncaught Exception thrown');
  process.exit(1);
});
