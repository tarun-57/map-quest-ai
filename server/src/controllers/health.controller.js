const healthService = require('../services/health.service');

function healthz(_req, res) {
  res.status(200).json(healthService.getHealth());
}

function readyz(_req, res) {
  const { ready, statusCode } = healthService.getReadiness();
  res.status(statusCode).json({ ready });
}

module.exports = { healthz, readyz };
