import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(`API Error on [${req.method} ${req.originalUrl}]:`, err);

  const status = err.status || 500;
  const message = err.message || 'An internal server error occurred';

  res.status(status).json({
    success: false,
    error: {
      message,
      // Stack traces withheld in production and general client responses
      code: err.code || 'INTERNAL_ERROR'
    }
  });
}
