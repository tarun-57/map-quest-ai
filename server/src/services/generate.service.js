const { config } = require('../config');
const { TtlCache } = require('../lib/cache');
const { withTimeout } = require('../lib/async');
const {
  ValidationError,
  GatewayTimeoutError,
  InternalError,
} = require('../lib/errors');
const { logger } = require('../lib/logger');
const geminiService = require('./gemini.service');

const hintCache = new TtlCache();

function validateCoordinates(input) {
  const lat = input?.lat;
  const lng = input?.lng;
  const latOk =
    typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const lngOk =
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180;

  if (!latOk || !lngOk) {
    throw new ValidationError(
      'Input must include numeric lat [-90,90] and lng [-180,180]',
    );
  }

  return { lat, lng };
}

function buildHintPrompt(lat, lng) {
  return `You are the witty, chronically online AI host for a geography guessing game.

Analyze the location at coordinates: { lat: ${lat}, lng: ${lng} }.
Generate three progressively simpler, one-line hints tailored for a Gen Z audience.

Tone & Style Guidelines:
- Use internet humor, pop culture references, memes, or local slang where applicable (e.g., "The vibes here are immaculate," "Home of the final boss of...", "Where [celebrity] got caught doing...").
- Keep it concise, sharp, and highly engaging.

Progressive Scope Constraints:
- hint1: Macro scale (Continent, Country, or massive global cultural footprint).
- hint2: Meso scale (State, City, or major regional identifiers).
- hint3: Micro scale (The exact neighborhood, street vibe, or defining landmark).

Strict Negative Constraints:
- NEVER use generic cliches like "This is a famous place" or "People love to visit here."
- Do not state the actual name of the city or landmark in hint1 or hint2.

CRITICAL INSTRUCTION: Return ONLY a valid JSON object. Do not include markdown formatting, backticks, or conversational text like "Here is the JSON". Start directly with the { bracket.`;
}

function cacheKeyFor(lat, lng) {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

async function generateHints(body) {
  const { lat, lng } = validateCoordinates(body?.input);
  const key = cacheKeyFor(lat, lng);

  const cached = hintCache.get(key);
  if (cached) {
    return { output: cached, cached: true };
  }

  const prompt = buildHintPrompt(lat, lng);
  const startedAt = Date.now();

  try {
    // Pass the schema and Maps grounding tool via the options object
    const rawOutput = await withTimeout(
      geminiService.generateContent(prompt, {
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              hint1: { type: 'STRING', description: 'Broadest scope (e.g., continent/country)' },
              hint2: { type: 'STRING', description: 'Medium scope (e.g., state/city)' },
              hint3: { type: 'STRING', description: 'Narrow scope (e.g., specific neighborhood/landmark)' },
            },
            required: ['hint1', 'hint2', 'hint3'],
          },
          tools: [{ googleMapsConnection: {} }],
        },
      }),
      config.requestTimeoutMs,
    );

    // Because we set responseMimeType to JSON, the SDK guarantees raw JSON without Markdown backticks.
    // const output = JSON.parse(rawOutput);
    console.log("*******************************************************")
    console.log(rawOutput)
    console.log("*******************************************************")
    let result;
    try {
      // Robust extraction: Find the first '{' and the last '}'
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

      if (!jsonMatch) {
        throw new Error('No JSON object found in the response');
      }

      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      logger.error('Failed to parse Gemini output as JSON', {
        rawOutput,
        error: parseError.message,
      });
      throw new Error('Invalid JSON format from AI');
    }

    output = {
      hint1: result.hint1,
      hint2: result.hint2,
      hint3: result.hint3,
    };

    hintCache.set(key, output, config.cacheTtlMs);
    const durationMs = Date.now() - startedAt;
    logger.info({ cacheKey: key, durationMs }, 'hints_generated');

    return { output, cached: false, durationMs };
  } catch (err) {
    const message = String(err?.message ?? err);
    logger.error({ message, cacheKey: key }, 'generation_error');

    if (message.includes('timed out')) {
      throw new GatewayTimeoutError();
    }

    const extras = {};
    if (!config.isProduction) {
      extras.debug = { message, preferredModel: config.gemini.model };
    }
    throw new InternalError('Generation failed', extras);
  }
}

module.exports = { generateHints };