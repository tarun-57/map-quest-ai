# MapQuest AI

Guess the location from Google Street View and unlock progressively easier AI hints. Play across the world, a continent, or a country (India, USA, UK). Monorepo with `client/` (React) and `server/` (Node/Express).

## Structure

```
map-quest-ai/
├── client/          # React app (CRA), nginx in production
│   └── src/api/     # HTTP client aligned with backend routes
└── server/          # Express API (controller–service layout)
    ├── index.js     # Entry point
    ├── src/
    │   ├── app.js
    │   ├── config/
    │   ├── controllers/
    │   ├── services/
    │   ├── routes/
    │   └── middleware/
    ├── data/regions/    # Precomputed Street View pools
    └── scripts/         # Pool builder
```

## Requirements

| Key | Used by |
|-----|---------|
| `GEMINI_API_KEY` | Server — hint generation |
| `GOOGLE_MAPS_API_KEY` | Server — pool builder (Street View metadata) |
| `REACT_APP_GCP_API_KEY` | Client — Maps & Street View |

## Quick start (Docker Compose)

1. Create `.env` in the repo root (or export variables):

```env
GEMINI_API_KEY=your_gemini_key
GOOGLE_MAPS_API_KEY=your_google_key
REACT_APP_GCP_API_KEY=your_maps_key
REACT_APP_API_BASE_URL=
CORS_ORIGIN=*
```

Leave `REACT_APP_API_BASE_URL` empty so the frontend calls same-origin `/api` (proxied by nginx).

2. Build region pools (minimal set to start):

```bash
cd server
GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY \
INCLUDE=country:India,country:USA,country:UK \
TARGET_PER_REGION=300 ATTEMPT_MULTIPLIER=8 \
node scripts/build-region-pool.js
```

3. Run:

```bash
docker compose -f server/docker-compose.yml up --build
```

- Frontend: http://localhost:8080  
- Backend: http://localhost:3300 (also reachable via frontend at `/api`)

## Local development

**Server**

```bash
cd server
# create .env with GEMINI_API_KEY (see server/README.md)
npm install
npm run dev
```

**Client**

```bash
cd client
npm install
npm start
```

The client `package.json` includes a dev proxy to `http://localhost:3300`, so you usually do **not** need `REACT_APP_API_BASE_URL` when running both locally.

Set `REACT_APP_API_BASE_URL=http://localhost:3300` in `client/.env` only if the client and server run on different hosts without the CRA proxy.

## API

### `POST /api/random-location`

Pick a random Street View location from a precomputed pool.

**Request**

```json
{ "scope": "world", "value": "" }
```

`scope`: `world` | `continent` | `country`. For continent/country, set `value` (e.g. `"Asia"`, `"India"`).

**Response** `200`

```json
{ "lat": 28.61, "lng": 77.23, "panoId": "..." }
```

### `POST /api/generate`

Generate three progressive hints for coordinates (Gemini, structured JSON).

**Request**

```json
{ "input": { "lat": 28.61, "lng": 77.23 } }
```

**Response** `200`

```json
{
  "output": {
    "hint1": "Broad geographic clue…",
    "hint2": "Regional clue…",
    "hint3": "Local clue…"
  },
  "cached": false,
  "durationMs": 1234
}
```

**Errors**: `400` validation, `504` timeout, `500` generation failure (may include `debug` in non-production).

### Health

- `GET /healthz` → `{ "status": "ok" }`
- `GET /readyz` → `{ "ready": true }`

### Diagnostics (optional)

- `GET /api/gemini-status` — lightweight Gemini connectivity check  
- `GET /api/gemini-raw` — raw ListModels responses for debugging  

See [server/README.md](server/README.md) for backend layout, env vars, and pool builder details.

## Build pools script

`server/scripts/build-region-pool.js` supports:

- `INCLUDE` (e.g. `country:India,country:USA`)
- `DRY_RUN=true`, `TARGET_PER_REGION`, `ATTEMPT_MULTIPLIER`, `METADATA_RADIUS_M`
- `LOG_LEVEL=error|warn|info|debug`, `LOG_JSON=true`

Outputs JSON to `server/data/regions/*.json`, consumed by `/api/random-location`.

## Deployment notes

- Frontend nginx proxies `/api/*` to the backend container.
- Set `CORS_ORIGIN` to your frontend domain in production.
- Backend logs: structured pino JSON; morgan access logs unless `REQUEST_LOGS=false`.
- Never commit `.env` files or API keys.
