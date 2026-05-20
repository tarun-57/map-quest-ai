/**
 * API base URL. Leave REACT_APP_API_BASE_URL unset or empty to use same-origin
 * relative paths (nginx /api proxy in production, CRA dev proxy in development).
 * Set explicitly (e.g. http://localhost:3300) when the backend runs on another origin.
 */
const envBase = process.env.REACT_APP_API_BASE_URL;
const BASE_URL = (envBase != null ? envBase : '').replace(/\/$/, '');

export function apiUrl(path) {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return BASE_URL ? `${BASE_URL}${suffix}` : suffix;
}
