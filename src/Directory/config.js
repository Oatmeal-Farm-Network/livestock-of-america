// Directory endpoints. Same backend + DB/tables as Oatmeal Farm Network
// (routers/businesses.py). Base follows LOA's convention: empty
// VITE_LIVESTOCK_API_URL → same-origin /api (Vite proxy in dev), otherwise the
// deployed livestock backend URL.
const BASE = (import.meta.env.VITE_LIVESTOCK_API_URL || '').replace(/\/+$/, '');
const API_BASE_URL = `${BASE}/api`;

export const API_ENDPOINTS = {
    COUNTRIES: `${API_BASE_URL}/businesses/countries`,
    STATES: `${API_BASE_URL}/businesses/states`,
    BUSINESSES: `${API_BASE_URL}/businesses/`,
};
