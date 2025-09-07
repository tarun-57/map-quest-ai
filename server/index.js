const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const pino = require('pino');
const pinoHttp = require('pino-http');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require("@google/generative-ai");

require('dotenv').config();

// Environment-driven configuration
const PORT = process.env.PORT || 3300;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS || 200);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 15000);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

if (!GEMINI_API_KEY) {
  // Fail fast if not configured
  // eslint-disable-next-line no-console
  console.error('GEMINI_API_KEY missing in environment');
  process.exit(1);
}

const app = express();

// Core middlewares
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: CORS_ORIGIN }));
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
app.use(pinoHttp({ logger }));
if (process.env.REQUEST_LOGS !== 'false') {
  app.use(morgan('combined'));
}

// Basic rate limiting for the generation endpoint
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

// Simple in-memory cache with TTL
const cache = new Map();
function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}
function setCache(key, value, ttlMs) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Create a model instance with sensible defaults
function getModel() {
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      candidateCount: 1
    }
  });
}

// Helper to enforce a timeout on async operations
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
  ]);
}

/** Health endpoint */
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
/** Readiness endpoint */
app.get('/readyz', (_req, res) => {
  const ready = Boolean(GEMINI_API_KEY);
  res.status(ready ? 200 : 500).json({ ready });
});

/**
 * Generate three progressively simpler hints for given coordinates using Gemini.
 * @param {string} prompt - Prepared prompt text.
 * @returns {Promise<string>} Model output as plain text.
 */
async function handleAPI(prompt) {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * POST /api/generate
 * Input: { input: { lat, lng } }
 * Output: { output: string, cached: boolean, durationMs?: number }
 */
app.post('/api/generate', generateLimiter, async (req, res) => {
  const { input } = req.body || {};

  // Basic validation
  const lat = input && input.lat;
  const lng = input && input.lng;
  const latOk = typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const lngOk = typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180;
  if (!latOk || !lngOk) {
    return res.status(400).json({ error: 'Input must include numeric lat [-90,90] and lng [-180,180]' });
  }

  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({ output: cached, cached: true });
  }

  const prompt = `Given the coordinates { lat: ${lat}, lng: ${lng} }, generate three progressively simpler one-line hints that help a Gen Z audience place a marker as close as possible to the exact location on a map.

Each hint must:
1. Reveal a progressively smaller geographic scope (continent → country → region/state → city/district → neighborhood/landmark).
2. Include a recognizable cultural, historical, or local fact when possible, otherwise provide a clear geographic clue.
3. Be engaging but concise.
4. Avoid vague statements like "it's a famous place."\n\nFormat strictly as:\nHint 1: ...\nHint 2: ...\nHint 3: ...`;

  const startedAt = Date.now();
  try {
    const output = await withTimeout(handleAPI(prompt), REQUEST_TIMEOUT_MS);
    setCache(cacheKey, output, CACHE_TTL_MS);
    const durationMs = Date.now() - startedAt;
    console.log(`generated in ${durationMs}ms for ${cacheKey}`);
    res.json({ output, cached: false, durationMs });
  } catch (error) {
    console.error('generation_error', { message: error.message });
    const status = error.message.includes('timed out') ? 504 : 500;
    res.status(status).json({ error: status === 504 ? 'Upstream model timed out' : 'Generation failed' });
  }
});

// ---------------- Random Street View Location API ----------------
// Simple region bounding boxes
const REGION_BOUNDS = {
  world: { minLat: -85, maxLat: 85, minLng: -180, maxLng: 180 },
  continents: {
    Africa: { minLat: -35, maxLat: 38, minLng: -20, maxLng: 52 },
    Asia: { minLat: -10, maxLat: 55, minLng: 25, maxLng: 150 },
    Europe: { minLat: 35, maxLat: 71, minLng: -25, maxLng: 45 },
    NorthAmerica: { minLat: 7, maxLat: 83, minLng: -170, maxLng: -50 },
    SouthAmerica: { minLat: -56, maxLat: 13, minLng: -82, maxLng: -34 },
    Oceania: { minLat: -50, maxLat: 0, minLng: 110, maxLng: 180 }
  },
  countries: {
    India: { minLat: 8, maxLat: 37, minLng: 68, maxLng: 97 },
    USA: { minLat: 24, maxLat: 49, minLng: -125, maxLng: -66 },
    UK: { minLat: 49.5, maxLat: 59.5, minLng: -8.5, maxLng: 1.8 }
  }
};

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function sampleCoordFromBounds(bounds) {
  return {
    lat: randomInRange(bounds.minLat, bounds.maxLat),
    lng: randomInRange(bounds.minLng, bounds.maxLng)
  };
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    const data = await resp.json();
    return data;
  } finally {
    clearTimeout(id);
  }
}

async function hasStreetView(lat, lng, apiKey) {
  try {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&source=default&key=${apiKey}`;
    const data = await fetchJsonWithTimeout(url, 5000);
    if (data && data.status === 'OK') {
      return { ok: true, pano_id: data.pano_id };
    }
    return { ok: false };
  } catch (e) {
    return { ok: false };
  }
}

function resolveBounds(scope, value) {
  if (scope === 'world') return REGION_BOUNDS.world;
  if (scope === 'continent') {
    // Normalize a few common names
    const key = {
      africa: 'Africa', asia: 'Asia', europe: 'Europe',
      northamerica: 'NorthAmerica', southamerica: 'SouthAmerica', oceania: 'Oceania'
    }[(value || '').replace(/\s+/g, '').toLowerCase()];
    return REGION_BOUNDS.continents[key] || REGION_BOUNDS.world;
  }
  if (scope === 'country') {
    const key = (value || '').toLowerCase();
    const map = { india: 'India', usa: 'USA', unitedstates: 'USA', uk: 'UK', unitedkingdom: 'UK' };
    const resolved = map[key];
    return REGION_BOUNDS.countries[resolved] || REGION_BOUNDS.world;
  }
  return REGION_BOUNDS.world;
}

// Serve from precomputed pools in data/regions/*.json
const fs = require('fs');
const path = require('path');
const POOLS_DIR = path.join(__dirname, 'data', 'regions');

function poolFile(scope, value) {
  if (scope === 'world') return path.join(POOLS_DIR, 'world.json');
  if (scope === 'continent') return path.join(POOLS_DIR, `continent-${value}.json`);
  if (scope === 'country') return path.join(POOLS_DIR, `country-${value}.json`);
  return path.join(POOLS_DIR, `${scope}-${value || 'default'}.json`);
}

function loadPool(scope, value) {
  try {
    const file = poolFile(scope, value);
    if (!fs.existsSync(file)) return [];
    const text = fs.readFileSync(file, 'utf8');
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

app.post('/api/random-location', async (req, res) => {
  const { scope = 'world', value } = req.body || {};
  const pool = loadPool(scope, value);
  if (pool.length === 0) {
    return res.status(503).json({ error: 'No precomputed locations available for this region. Please run the pool builder.' });
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return res.json({ lat: pick.lat, lng: pick.lng, panoId: pick.panoId || null });
});

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${PORT}`);
});

// Optional warm-up to reduce first-request latency
if (process.env.WARMUP_ON_START === 'true') {
  (async () => {
    try {
      await withTimeout(handleAPI('Reply with "OK"'), 5000);
      // eslint-disable-next-line no-console
      console.log('Warm-up completed');
    } catch {
      // eslint-disable-next-line no-console
      console.warn('Warm-up skipped or failed');
    }
  })();
}

// Graceful shutdown
function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Force exit if not closed in time
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
