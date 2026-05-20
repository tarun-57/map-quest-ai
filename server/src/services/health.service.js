const { config } = require('../config');

function getHealth() {
  return { status: 'ok' };
}

function getReadiness() {
  const ready = Boolean(config.gemini.apiKey);
  return { ready, statusCode: ready ? 200 : 500 };
}

module.exports = { getHealth, getReadiness };
