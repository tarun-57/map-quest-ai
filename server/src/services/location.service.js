const fs = require('fs');
const path = require('path');
const { config } = require('../config');
const { ServiceUnavailableError } = require('../lib/errors');

function poolFile(scope, value) {
  if (scope === 'world') {
    return path.join(config.poolsDir, 'world.json');
  }
  if (scope === 'continent') {
    return path.join(config.poolsDir, `continent-${value}.json`);
  }
  if (scope === 'country') {
    return path.join(config.poolsDir, `country-${value}.json`);
  }
  return path.join(config.poolsDir, `${scope}-${value || 'default'}.json`);
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

function getRandomLocation({ scope = 'world', value } = {}) {
  const pool = loadPool(scope, value);
  if (pool.length === 0) {
    throw new ServiceUnavailableError(
      'No precomputed locations available for this region. Please run the pool builder.',
    );
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  return {
    lat: pick.lat,
    lng: pick.lng,
    panoId: pick.panoId || null,
  };
}

module.exports = { getRandomLocation, loadPool };
