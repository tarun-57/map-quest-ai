import { apiUrl } from './config';

export async function fetchRandomLocation(region) {
  const body = {
    scope: region?.scope || 'world',
    value: region?.value || ''
  };
  const resp = await fetch(apiUrl('/api/random-location'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}


