const { GoogleGenAI } = require('@google/genai');
const { config } = require('../config');
const { withTimeout } = require('../lib/async');
const { logger } = require('../lib/logger');

// Initialize the new client
const genAI = new GoogleGenAI({ apiKey: config.gemini.apiKey });

function uniqueModelCandidates(preferred) {
  const seen = new Set();
  return [preferred, ...config.gemini.fallbackModels].filter((m) => {
    if (!m || seen.has(m)) return false;
    seen.add(m);
    return true;
  });
}

async function generateContent(prompt, options = {}) {
  const preferred = options.model ?? config.gemini.model;
  const candidates = uniqueModelCandidates(preferred);
  let lastError;

  for (const modelName of candidates) {
    try {
      // 1. Call generateContent directly on the client using the modernized payload structure
      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { // 2. generationConfig is now just 'config'
          maxOutputTokens: config.gemini.maxOutputTokens,
          temperature: 0.7,
          thinkingConfig: {
            thinkingBudget: 0
          },
          ...(options.config || {})
        },
      });

      if (modelName !== preferred) {
        logger.warn(
          { usedModel: modelName, preferredModel: preferred },
          'Using fallback Gemini model',
        );
      }

      // 3. Extracting the text is now a direct property, not a chained function
      return response.text;

    } catch (err) {
      const message = String(err?.message ?? err);
      if (/not found|not\s+supported|404/i.test(message)) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('No available Gemini model for generateContent');
}

async function checkStatus() {
  // Update the status check to use the new method signature
  const result = await withTimeout(
    genAI.models.generateContent({
        model: config.gemini.model,
        contents: 'Reply with OK'
    }),
    5000,
  );

  // Safely extract the text using the new property structure
  const text = result?.text || '';

  return { ok: true, model: config.gemini.model, sample: text.slice(0, 50) };
}

async function fetchRawEndpoint(url) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      headers: { 'x-goog-api-key': config.gemini.apiKey },
      signal: controller.signal,
    });
    const text = await response.text();
    return { status: response.status, url, text };
  } catch (err) {
    return {
      status: 0,
      url,
      text: String(err?.message ?? err),
    };
  } finally {
    clearTimeout(id);
  }
}

async function listRawModels() {
  const urls = [
    'https://generativelanguage.googleapis.com/v1beta/models',
    'https://generativelanguage.googleapis.com/v1/models',
  ];
  const results = [];
  for (const url of urls) {
    results.push(await fetchRawEndpoint(url));
  }
  return {
    keyPresent: Boolean(config.gemini.apiKey),
    model: config.gemini.model,
    results,
  };
}

module.exports = {
  generateContent,
  checkStatus,
  listRawModels,
};