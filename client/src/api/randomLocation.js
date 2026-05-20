import { ENDPOINTS } from './endpoints';
import { apiPost } from './http';

export async function fetchRandomLocation(region) {
  return apiPost(ENDPOINTS.RANDOM_LOCATION, {
    scope: region?.scope || 'world',
    value: region?.value || '',
  });
}
