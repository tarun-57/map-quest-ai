#!/usr/bin/env node
/*
  Build precomputed pools of Street View-capable coordinates per region.
  Usage:
    GOOGLE_MAPS_API_KEY=... node scripts/build-region-pool.js

  Optional env:
    TARGET_PER_REGION (default 500)
    METADATA_RADIUS_M (default 3000)
    ATTEMPT_MULTIPLIER (default 12) // max attempts = TARGET * MULTIPLIER
    INCLUDE (e.g., "country:India,country:USA" or "continent:Asia" or "world")
    DRY_RUN (true/false) - estimate counts without making API calls
    LOG_LEVEL (error|warn|info|debug) default info
    LOG_JSON (true/false) default false
*/

const fs = require('fs');
const path = require('path');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GCP_API_KEY;
if (!GOOGLE_MAPS_API_KEY) {
  // eslint-disable-next-line no-console
  console.error('Missing GOOGLE_MAPS_API_KEY');
  process.exit(1);
}

const TARGET_PER_REGION = Number(process.env.TARGET_PER_REGION || 500);
const METADATA_RADIUS_M = Number(process.env.METADATA_RADIUS_M || 3000);
const ATTEMPT_MULTIPLIER = Number(process.env.ATTEMPT_MULTIPLIER || 12);
const INCLUDE = process.env.INCLUDE || '';
const DRY_RUN = String(process.env.DRY_RUN || '').toLowerCase() === 'true' || process.env.DRY_RUN === '1';
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const LOG_JSON = String(process.env.LOG_JSON || '').toLowerCase() === 'true' || process.env.LOG_JSON === '1';

// Logger
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
function nowIso() { return new Date().toISOString(); }
function shouldLog(level) {
  const current = LEVELS[LOG_LEVEL] ?? LEVELS.info;
  const incoming = LEVELS[level] ?? LEVELS.info;
  return incoming <= current;
}
function log(level, message, fields) {
  if (!shouldLog(level)) return;
  if (LOG_JSON) {
    const payload = Object.assign({ level, time: nowIso(), msg: message }, fields || {});
    console.log(JSON.stringify(payload));
  } else {
    const suffix = fields ? ` ${JSON.stringify(fields)}` : '';
    console.log(`[${nowIso()}] ${level.toUpperCase()} ${message}${suffix}`);
  }
}

// Output directory
const OUT_DIR = path.join(process.cwd(), 'data', 'regions');
fs.mkdirSync(OUT_DIR, { recursive: true });

// Region bounds (coarse v1)
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
    return await resp.json();
  } finally {
    clearTimeout(id);
  }
}

async function streetViewMetadata(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=${METADATA_RADIUS_M}&source=default&key=${GOOGLE_MAPS_API_KEY}`;
  return fetchJsonWithTimeout(url, 8000);
}

async function reverseGeocodeCountry(lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=country&key=${GOOGLE_MAPS_API_KEY}`;
  const data = await fetchJsonWithTimeout(url, 8000);
  if (!data || !Array.isArray(data.results) || data.results.length === 0) return null;
  const comp = data.results[0].address_components || [];
  const country = comp.find(c => (c.types || []).includes('country'));
  if (!country) return null;
  return { name: country.long_name, code: country.short_name };
}

function regionFileName(scope, value) {
  if (scope === 'world') return 'world.json';
  if (scope === 'continent') return `continent-${value}.json`;
  if (scope === 'country') return `country-${value}.json`;
  return `${scope}-${value || 'default'}.json`;
}

function loadExisting(scope, value) {
  const file = path.join(OUT_DIR, regionFileName(scope, value));
  if (!fs.existsSync(file)) return [];
  try {
    const text = fs.readFileSync(file, 'utf8');
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function buildForRegion(scope, value, bounds) {
  const existing = loadExisting(scope, value);
  const want = TARGET_PER_REGION;
  const remaining = Math.max(0, want - existing.length);
  const maxAttempts = remaining * ATTEMPT_MULTIPLIER;
  const out = existing.slice();
  const seenPanos = new Set(existing.map(e => e.panoId).filter(Boolean));

  if (DRY_RUN) {
    log('info', 'DRY_RUN region planning', { scope, value, existing: existing.length, target: want, attempts_estimate: maxAttempts });
    return; // no writes
  }

  log('info', 'Building region', { scope, value, existing: existing.length, target: want, maxAttempts });

  for (let i = 0; i < maxAttempts && out.length < want; i++) {
    const s = sampleCoordFromBounds(bounds);
    const meta = await streetViewMetadata(s.lat, s.lng);
    if (!meta || meta.status !== 'OK') continue;
    const panoLat = meta.location?.lat;
    const panoLng = meta.location?.lng;
    const panoId = meta.pano_id || undefined;
    if (!Number.isFinite(panoLat) || !Number.isFinite(panoLng)) continue;
    if (panoId && seenPanos.has(panoId)) continue;

    if (scope === 'country') {
      let ok = false;
      let detected = null;
      try {
        const country = await reverseGeocodeCountry(panoLat, panoLng);
        if (country) {
          detected = country;
          const expect = String(value).toLowerCase();
          ok = (expect === 'usa' ? (country.code === 'US' || /united states/i.test(country.name))
               : expect === 'uk' ? (country.code === 'GB' || /united kingdom|uk/i.test(country.name))
               : expect === 'india' ? (country.code === 'IN' || /india/i.test(country.name))
               : false);
        }
      } catch (e) {
        // ignore geocode errors; fallback to bounds check
      }
      if (!ok) {
        // Fallback: accept if pano is within the requested country's bounding box
        const inside = panoLat >= bounds.minLat && panoLat <= bounds.maxLat && panoLng >= bounds.minLng && panoLng <= bounds.maxLng;
        if (!inside) {
          log('debug', 'Filtered pano outside country bounds', { scope, value, panoLat, panoLng, detected: detected ? detected.code : undefined });
          continue;
        }
      }
    }

    out.push({ lat: panoLat, lng: panoLng, panoId });
    if (panoId) seenPanos.add(panoId);
    if (out.length % 50 === 0) {
      log('info', 'Progress', { scope, value, found: out.length, target: want });
    }
  }

  const file = path.join(OUT_DIR, regionFileName(scope, value));
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  log('info', 'Saved region pool', { scope, value, file, total: out.length, newlyAdded: Math.max(0, out.length - existing.length) });
}

function normalizeContinentName(name) {
  const key = String(name || '').replace(/\s+/g, '').toLowerCase();
  const map = { africa: 'Africa', asia: 'Asia', europe: 'Europe', northamerica: 'NorthAmerica', southamerica: 'SouthAmerica', oceania: 'Oceania' };
  return map[key] || null;
}

function parseInclude() {
  if (!INCLUDE) return null; // build all
  const tokens = INCLUDE.split(',').map(s => s.trim()).filter(Boolean);
  const list = [];
  for (const t of tokens) {
    const parts = t.split(':');
    if (parts.length === 1) {
      const scope = parts[0].toLowerCase();
      if (scope === 'world') list.push({ scope: 'world', value: 'world', bounds: REGION_BOUNDS.world });
      continue;
    }
    const scope = parts[0].toLowerCase();
    const value = parts[1];
    if (scope === 'continent') {
      const norm = normalizeContinentName(value);
      if (norm && REGION_BOUNDS.continents[norm]) list.push({ scope: 'continent', value: norm, bounds: REGION_BOUNDS.continents[norm] });
    } else if (scope === 'country') {
      const cap = value; // expect India/USA/UK
      if (REGION_BOUNDS.countries[cap]) list.push({ scope: 'country', value: cap, bounds: REGION_BOUNDS.countries[cap] });
    }
  }
  return list;
}

(async () => {
  log('info', 'Starting pool build', {
    DRY_RUN,
    TARGET_PER_REGION,
    METADATA_RADIUS_M,
    ATTEMPT_MULTIPLIER,
    INCLUDE: INCLUDE || '(all)'
  });

  const selected = parseInclude();
  if (selected && selected.length > 0) {
    for (const item of selected) {
      log('info', 'Selected region', { scope: item.scope, value: item.value });
      await buildForRegion(item.scope, item.value, item.bounds);
    }
  } else {
    log('info', 'No INCLUDE provided, building all');
    await buildForRegion('world', 'world', REGION_BOUNDS.world);
    for (const [name, b] of Object.entries(REGION_BOUNDS.continents)) {
      await buildForRegion('continent', name, b);
    }
    for (const [name, b] of Object.entries(REGION_BOUNDS.countries)) {
      await buildForRegion('country', name, b);
    }
  }

  log('info', 'Done.');
})().catch((e) => {
  log('error', 'Builder failed', { error: e && e.message ? e.message : String(e) });
  process.exit(1);
});


