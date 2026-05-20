const { HttpError } = require('../lib/errors');
const { config } = require('../config');
const { logger } = require('../lib/logger');

function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    const payload = { error: err.message, ...err.extras };
    return res.status(err.statusCode).json(payload);
  }

  const message = String(err?.message ?? err);
  logger.error({ err: message, path: req.path }, 'unhandled_error');

  const status = message.includes('timed out') ? 504 : 500;
  const payload = {
    error: status === 504 ? 'Upstream model timed out' : 'Internal server error',
  };

  if (!config.isProduction) {
    payload.debug = { message };
  }

  res.status(status).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
