const { validateConfig } = require('./src/config');
const { startServer } = require('./src/server');

validateConfig();
startServer();
