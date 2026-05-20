const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const pinoHttp = require('pino-http');
const { config } = require('./config');
const { logger } = require('./lib/logger');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(cors({ origin: config.corsOrigin }));
  app.use(pinoHttp({ logger }));

  if (config.requestLogs) {
    app.use(morgan('combined'));
  }

  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;
