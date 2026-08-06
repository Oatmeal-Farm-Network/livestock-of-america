// src/pages/herd-health/herdAuth.js
import { getToken } from '../../lib/auth';

export function herdAuthHeaders(json = false) {
  const token = getToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
