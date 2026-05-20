import { ENDPOINTS } from './endpoints';
import { apiPost } from './http';

function isValidCoordinate(coord) {
  const { lat, lng } = coord || {};
  const latOk =
    typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const lngOk =
    typeof lng === 'number' &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180;
  return latOk && lngOk;
}

function normalizeHint(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Parses POST /api/generate response:
 * { output: { hint1, hint2, hint3 }, cached?: boolean, durationMs?: number }
 */
export function parseGenerateResponse(data) {
  const output = data?.output;
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    throw new Error('Invalid hints format');
  }

  const hints = {
    hint1: normalizeHint(output.hint1),
    hint2: normalizeHint(output.hint2),
    hint3: normalizeHint(output.hint3),
  };

  if (!hints.hint1 && !hints.hint2 && !hints.hint3) {
    throw new Error('Invalid hints format');
  }

  return {
    hints,
    cached: Boolean(data?.cached),
    durationMs: typeof data?.durationMs === 'number' ? data.durationMs : undefined,
  };
}

/** @returns {Promise<{ hints: { hint1: string, hint2: string, hint3: string }, cached: boolean, durationMs?: number }>} */
export async function fetchHints(input) {
  if (!isValidCoordinate(input)) {
    throw new Error('Valid coordinates are required to fetch hints');
  }

  const data = await apiPost(ENDPOINTS.GENERATE, { input });
  return parseGenerateResponse(data);
}

/** Convenience for components that display hints as an array. */
export function hintsAsArray(hints) {
  return [hints.hint1, hints.hint2, hints.hint3];
}
