import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { retrievalService } from './services/retrievalService.js';

const PORT = config.port;

async function bootstrap() {
  try {
    // Pre-warm the policy retrieval index
    logger.info('Pre-warming policy knowledge retrieval index...');
    await retrievalService.ensureIndex();

    app.listen(PORT, () => {
      logger.info(`🚀 Noise Resolve AI Server is running on http://localhost:${PORT}`);
      logger.info(`⚙️  Active AI Provider: ${config.aiProvider.toUpperCase()}`);
      logger.info(`📦 Database: ${config.databaseUrl}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
