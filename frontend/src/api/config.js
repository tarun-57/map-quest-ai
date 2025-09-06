const BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

export function apiUrl(path) {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${suffix}`;
}


