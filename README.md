# MapQuest AI

Guess the location from Google Street View and get AI-powered hints. Choose to play across the world, a continent, or a country (India, USA, UK). Built with React + Google Maps on the frontend and Node/Express on the backend.

## Features
- Single-player GeoGuessr-like gameplay using Google Street View
- Region selection: world, continent, or specific country (India, USA, UK)
- AI hints (Gemini) with progressive unlocks and score deduction
- Multi-round scoring and end-of-game summary
- Precomputed Street View location pools for fast loads
- Production-ready Docker setup with Nginx frontend proxying /api to backend

## Requirements
- Google API keys:
  - GOOGLE_MAPS_API_KEY (Street View Metadata, Geocoding)
  - REACT_APP_GCP_API_KEY (Maps/Street View on frontend)
- Gemini API key: GEMINI_API_KEY

## Quick start (Docker Compose)
1. Create a `.env` in project root with:
```
GEMINI_API_KEY=your_gemini_key
GOOGLE_MAPS_API_KEY=your_google_key
# Optional if frontend should call a different host; with compose we proxy /api via nginx
REACT_APP_API_BASE_URL=
CORS_ORIGIN=*
```
2. Build region pools (pick minimal to start, e.g. the 3 countries):
```
GOOGLE_MAPS_API_KEY=your_google_key \
INCLUDE=country:India,country:USA,country:UK \
TARGET_PER_REGION=300 ATTEMPT_MULTIPLIER=8 \
node scripts/build-region-pool.js
```
3. Start
```
docker compose up --build
```
- Frontend: http://localhost:8080
- Backend: http://localhost:3300 (proxied through frontend at /api)

## Local development
Backend:
```
npm install
npm run dev
```
Frontend:
```
cd frontend
npm install
npm start
```
Set `REACT_APP_API_BASE_URL` in a `.env` file in `frontend/` if backend runs on a different origin (otherwise CRA will call same-origin and you can proxy in dev).

## Building pools (script)
Script: `scripts/build-region-pool.js`

Environment variables:
- `GOOGLE_MAPS_API_KEY` (required)
- `TARGET_PER_REGION` (default 500)
- `METADATA_RADIUS_M` (default 3000)
- `ATTEMPT_MULTIPLIER` (default 12)
- `INCLUDE` (filters to specific regions, e.g., `country:India,continent:Asia,world`)
- `DRY_RUN` (true/false) to estimate work without API calls
- `LOG_LEVEL` (error|warn|info|debug) and `LOG_JSON` (true/false)

Examples:
```
# Dry run estimate for India
GOOGLE_MAPS_API_KEY=... INCLUDE=country:India DRY_RUN=true node scripts/build-region-pool.js

# Build three countries with logs
GOOGLE_MAPS_API_KEY=... INCLUDE=country:India,country:USA,country:UK LOG_LEVEL=info node scripts/build-region-pool.js
```

Outputs are written to `data/regions/*.json` and used by `/api/random-location`.

## API
- `POST /api/random-location` body `{ scope: 'world'|'continent'|'country', value?: string }` → `{ lat, lng, panoId? }`
- `POST /api/generate` body `{ input: { lat, lng } }` → `{ output }` (3 formatted hints)
- `GET /healthz` and `GET /readyz`

## Deployment notes
- Frontend container (nginx) proxies `/api/*` to backend container; set custom domains with `CORS_ORIGIN` if serving backend separately
- Backend logs: pino JSON structured logs; optionally morgan access logs unless `REQUEST_LOGS=false`
- Ensure `REACT_APP_API_BASE_URL` is set only if you are not reverse-proxying `/api` via the frontend

## Security & quotas
- Keep API keys private. Backend uses server-side Google keys for metadata/geocoding
- Monitor Google API usage; building pools can consume quota. Use `INCLUDE` + `DRY_RUN` to control costs

## License
ISC
