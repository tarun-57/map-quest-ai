const { config } = require('./config');
const { createApp } = require('./app');
const { withTimeout } = require('./lib/async');
const { logger } = require('./lib/logger');
const geminiService = require('./services/gemini.service');

function startServer() {
  const app = createApp();
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running on port ${config.port}`);
  });

  if (config.warmupOnStart) {
    warmup();
  }

  registerShutdown(server);
  return server;
}

async function warmup() {
  try {
    await withTimeout(geminiService.generateContent('Reply with "OK"'), 5000);
    logger.info('Warm-up completed');
  } catch {
    logger.warn('Warm-up skipped or failed');
  }
}

function registerShutdown(server) {
  function shutdown(signal) {
    // eslint-disable-next-line no-console
    console.log(`Received ${signal}, shutting down...`);
    server.close(() => {
      // eslint-disable-next-line no-console
      console.log('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = { startServer };
