require('dotenv').config();

const config = {
  port: Number(process.env.PORT || 3300),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
    maxOutputTokens: Number(process.env.MAX_OUTPUT_TOKENS || 500),
    fallbackModels: [
      'gemini-2.5-flash',
      'gemini-flash-latest',
    ],
  },

  requestTimeoutMs: Number(150000 || process.env.REQUEST_TIMEOUT_MS || 15000),
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'info',
  requestLogs: process.env.REQUEST_LOGS !== 'false',
  warmupOnStart: process.env.WARMUP_ON_START === 'true',

  poolsDir: require('path').join(__dirname, '../../data/regions'),
};

function validateConfig() {
  if (!config.gemini.apiKey) {
    // eslint-disable-next-line no-console
    console.error('GEMINI_API_KEY missing in environment');
    process.exit(1);
  }
}

module.exports = { config, validateConfig };
