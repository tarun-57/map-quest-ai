# MapQuest AI

Deployed URLs:
Frontend - https://map-quest-ai.vercel.app
Backend - https://map-quest-ai-backend.vercel.app

Guess the location from Google Street View and get AI-powered hints. Choose to play across the world, a continent, or a country (India, USA, UK). Monorepo layout with `client/` (React) and `server/` (Node/Express).

## Structure
- `client/`: React app 
- `server/`: Express API with Gemini hints and precomputed Street View pools

## Requirements
- Google APIs: GOOGLE_MAPS_API_KEY (Street View Metadata, Geocoding)
- Frontend Maps: REACT_APP_GCP_API_KEY
- Gemini: GEMINI_API_KEY

## Quick start (Docker Compose)
1) Create `.env` (repo root):
```
GEMINI_API_KEY=your_gemini_key
GOOGLE_MAPS_API_KEY=your_google_key
REACT_APP_API_BASE_URL=
CORS_ORIGIN=*
```
2) Build region pools (choose minimal set to start or you can use the existing pools):
```
cd server
GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY \
INCLUDE=country:India,country:USA,country:UK \
TARGET_PER_REGION=300 ATTEMPT_MULTIPLIER=8 \
node scripts/build-region-pool.js
```
3) Run:
```
docker compose -f server/docker-compose.yml up --build
```
- Frontend: http://localhost:8080
- Backend: http://localhost:3300 (proxied via frontend at /api)

## Local development
Server:
```
cd server
npm install
npm run dev
```
Client:
```
cd client
npm install
npm start
```
For separate origins in dev, set `client/.env` with `REACT_APP_API_BASE_URL=http://localhost:3300`.

## Build pools script
`server/scripts/build-region-pool.js` supports:
- INCLUDE (e.g., `country:India,country:USA`), DRY_RUN=true, TARGET_PER_REGION, ATTEMPT_MULTIPLIER, METADATA_RADIUS_M
- LOG_LEVEL=error|warn|info|debug, LOG_JSON=true

Outputs JSON files to `server/data/regions/*.json`, consumed by `/api/random-location`.

## API
- `POST /api/random-location` { scope, value? } → { lat, lng, panoId? }
- `POST /api/generate` { input: { lat, lng } } → { output }
- Health: `/healthz` and `/readyz`



