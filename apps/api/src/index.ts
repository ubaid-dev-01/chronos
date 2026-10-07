import { createServer } from 'http';
import { connectDB } from '@chronos/db';
import { app } from './app';
import { initWebSocket } from './websocket';
import { env } from './config/env';
import { logger } from './utils/logger';

async function bootstrap() {
  // 1. Connect to MongoDB
  if (env.MONGODB_URI) {
    await connectDB();
    logger.info('MongoDB connected');
  } else {
    logger.warn('MONGODB_URI not set running without database');
  }

  // 2. Create HTTP server
  const httpServer = createServer(app);

  // 3. Initialize WebSocket (Socket.io)
  initWebSocket(httpServer);

  // 4. Start listening
  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(
        `Port ${env.PORT} is already in use. Stop the other Chronos API process or set a different PORT.`,
      );
    } else {
      logger.error('HTTP server error:', err);
    }
    process.exit(1);
  });

  httpServer.listen(env.PORT, () => {
    logger.info(`API server running on port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down...');
    httpServer.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});