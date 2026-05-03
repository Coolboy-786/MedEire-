const logger = require('./logger');

/*
 * DESIGN PATTERN: Middleware Chain (Pattern #3)
 *
 * Express error-handling middleware has a 4-argument signature (err, req, res, next).
 * By mounting this LAST in server.js, it catches every error forwarded via next(err)
 * anywhere in the application. This centralises error formatting so every route
 * returns the same JSON shape: { error: { code, message } }.
 *
 * Why: scattered try/catch with ad-hoc res.status() calls across 20+ routes is a
 * maintenance nightmare. One handler means one place to change the response format.
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  logger.error(`${err.name || 'Error'}: ${err.message} — ${req.method} ${req.originalUrl}`);

  // Don't leak internal stack traces to clients in production.
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'An unexpected error occurred'
      : err.message;

  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
    },
  });
};

module.exports = errorHandler;
