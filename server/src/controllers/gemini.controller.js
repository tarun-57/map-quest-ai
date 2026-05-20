const { config } = require('../config');
const { logger } = require('../lib/logger');
const geminiService = require('../services/gemini.service');

async function status(_req, res) {
  try {
    const result = await geminiService.checkStatus();
    res.status(200).json(result);
  } catch (err) {
    const message = String(err?.message ?? err);
    logger.warn({ err: message }, 'gemini_status_check_failed');
    res.status(200).json({
      ok: false,
      model: config.gemini.model,
      message,
    });
  }
}

async function raw(_req, res) {
  const payload = await geminiService.listRawModels();
  res.json(payload);
}

module.exports = { status, raw };
