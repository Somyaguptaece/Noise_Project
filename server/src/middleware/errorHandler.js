import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const rawMessage = err.message || 'An internal server error occurred';
  const sanitizedMessage = rawMessage
    .replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]')
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi, '[REDACTED_EMAIL]')
    .replace(/\b\d{10}\b/g, '[REDACTED_PHONE]');

  logger.error(`API Error on [${req.method} ${req.originalUrl}]: ${sanitizedMessage}`);

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    error: {
      message: sanitizedMessage,
      // Stack traces withheld in production and general client responses
      code: err.code || 'INTERNAL_ERROR'
    }
  });
}
