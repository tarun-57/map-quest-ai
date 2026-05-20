# MapQuest AI — Server

Express API for random Street View locations and Gemini-powered hints. The codebase uses a **controller–service** layout under `src/`.

## Features

- Single-player GeoGuessr-style locations from precomputed pools
- Region scopes: world, continent, or country (India, USA, UK)
- Structured JSON hints via Gemini (`hint1` → `hint2` → `hint3`)
- In-memory hint caching with TTL
- Rate limiting, helmet, compression, structured logging
- Docker + nginx frontend proxy in production

## Project layout

```
server/
├── index.js                 # Boot: validate config, start HTTP server
├── src/
│   ├── app.js               # Express app + global middleware
│   ├── server.js            # Listen, optional warmup, graceful shutdown
│   ├── config/index.js      # Environment configuration
│   ├── routes/              # Route definitions
│   ├── controllers/         # HTTP handlers (thin)
│   ├── services/            # Business logic
│   │   ├── gemini.service.js
│   │   ├── generate.service.js
│   │   ├── location.service.js
│   │   └── health.service.js
│   ├── middleware/          # Rate limit, errors, async wrapper
│   └── lib/                 # Cache, logger, typed errors, timeouts
├── data/regions/            # Precomputed coordinate pools (*.json)
└── scripts/
    └── build-region-pool.js
```

## Requirements

- **GEMINI_API_KEY** (required) — hint generation  
- **GOOGLE_MAPS_API_KEY** — Street View metadata when building pools  
- **REACT_APP_GCP_API_KEY** — frontend only (not used by this service)

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3300` | HTTP port |
| `GEMINI_API_KEY` | — | Required |
| `GEMINI_MODEL` | `gemini-flash-latest` | Primary model |
| `MAX_OUTPUT_TOKENS` | `500` | Gemini output cap |
| `REQUEST_TIMEOUT_MS` | `15000` | Upstream timeout for `/api/generate` |
| `CACHE_TTL_MS` | `600000` | Hint cache TTL (10 min) |
| `CORS_ORIGIN` | `*` | CORS allowed origin |
| `LOG_LEVEL` | `info` | Pino log level |
| `REQUEST_LOGS` | `true` | Set `false` to disable morgan |
| `WARMUP_ON_START` | `false` | Set `true` to ping Gemini on boot |
| `NODE_ENV` | `development` | `production` hides error `debug` fields |

## Quick start (Docker Compose)

From the **repository root**, create `.env` with keys, build pools (see below), then:

```bash
docker compose -f server/docker-compose.yml up --build
```

- Frontend: http://localhost:8080  
- Backend: http://localhost:3300 (proxied at `/api` through nginx)

## Local development

```bash
cd server
npm install
npm run dev    # nodemon
# or
npm start
```

Create `server/.env`:

```env
GEMINI_API_KEY=your_key
GOOGLE_MAPS_API_KEY=your_key
PORT=3300
```

Run the React client from `../client` (see root [README.md](../README.md)).

## Building location pools

Script: `scripts/build-region-pool.js`

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_MAPS_API_KEY` | required | Street View metadata |
| `TARGET_PER_REGION` | `500` | Target locations per pool file |
| `METADATA_RADIUS_M` | `3000` | Metadata search radius |
| `ATTEMPT_MULTIPLIER` | `12` | Max attempts = target × multiplier |
| `INCLUDE` | all regions | Filter, e.g. `country:India,country:USA` |
| `DRY_RUN` | `false` | Estimate work without API calls |
| `LOG_LEVEL` | `info` | `error` \| `warn` \| `info` \| `debug` |
| `LOG_JSON` | `false` | JSON log lines |

Examples:

```bash
# Dry run for India
GOOGLE_MAPS_API_KEY=... INCLUDE=country:India DRY_RUN=true node scripts/build-region-pool.js

# Build three countries
GOOGLE_MAPS_API_KEY=... INCLUDE=country:India,country:USA,country:UK LOG_LEVEL=info node scripts/build-region-pool.js
```

Outputs: `data/regions/*.json` (e.g. `world.json`, `continent-Asia.json`, `country-India.json`).

## API reference

### `POST /api/random-location`

Returns a random coordinate from a precomputed pool.

**Body**

```json
{ "scope": "world", "value": "" }
```

| `scope` | `value` examples |
|---------|------------------|
| `world` | omit or `""` |
| `continent` | `Africa`, `Asia`, `Europe`, `NorthAmerica`, `SouthAmerica`, `Oceania` |
| `country` | `India`, `USA`, `UK` |

**Response** `200`

```json
{ "lat": 28.61, "lng": 77.23, "panoId": "abc123" }
```

**Response** `503` — no pool file for the region (run the builder).

---

### `POST /api/generate`

Generates three progressive hints for the given coordinates using Gemini with a JSON response schema and optional Google Maps grounding.

**Body**

```json
{ "input": { "lat": 28.61, "lng": 77.23 } }
```

**Response** `200`

```json
{
  "output": {
    "hint1": "Macro-scale clue (continent/country vibe)",
    "hint2": "Meso-scale clue (state/city)",
    "hint3": "Micro-scale clue (neighborhood/landmark)"
  },
  "cached": false,
  "durationMs": 1523
}
```

When served from cache, `cached` is `true` and `durationMs` is omitted.

**Errors**

| Status | Body |
|--------|------|
| `400` | `{ "error": "Input must include numeric lat…" }` |
| `504` | `{ "error": "Upstream model timed out" }` |
| `500` | `{ "error": "Generation failed", "debug": { … } }` — `debug` only when `NODE_ENV` ≠ `production` |

Rate limit: 30 requests/minute per IP on this route.

---

### Health & diagnostics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/healthz` | Liveness — `{ "status": "ok" }` |
| `GET` | `/readyz` | Readiness — `{ "ready": true }` |
| `GET` | `/api/gemini-status` | Test Gemini key/model |
| `GET` | `/api/gemini-raw` | Raw ListModels probe (debug) |

## Client integration

The React app in `client/src/api/` calls these endpoints:

- `fetchRandomLocation()` → `POST /api/random-location`
- `fetchHints()` → `POST /api/generate` (parses `output.hint1|hint2|hint3`)

Use an empty `REACT_APP_API_BASE_URL` in Docker/production so requests go to same-origin `/api`.

## Deployment notes

- `Dockerfile` copies `index.js`, `src/`, and `data/`.
- Frontend nginx (`client/nginx.conf`) proxies `/api/` to the backend service.
- Restrict `CORS_ORIGIN` in production.
- Pool building can consume significant Google API quota — use `INCLUDE` and `DRY_RUN` to control cost.

## Security

- Keep `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY` server-side only.
- Do not commit `.env` files.
- Diagnostic routes (`/api/gemini-raw`) are intended for development/troubleshooting.

## License

ISC
