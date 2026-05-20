# MapQuest AI — client

React (Create React App) frontend for the geography guessing game.

## Environment

Copy `.env.example` to `.env.local` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_GCP_API_KEY` | Yes | Google Maps JavaScript API key (Street View + Maps). Restrict by HTTP referrer in Google Cloud. |
| `REACT_APP_API_BASE_URL` | No | Backend origin (e.g. `http://localhost:3300`). Leave empty to use same-origin `/api` (Docker + nginx) or the dev `proxy` in `package.json`. |

Never commit `.env` or real API keys.

## Scripts

- `npm start` — dev server
- `npm run build` — optimized production bundle
- `npm test` — tests

## Docker

Build args mirror the env vars above (`REACT_APP_API_BASE_URL`, `REACT_APP_GCP_API_KEY`). The image serves static files with nginx and proxies `/api` to the backend.
