const API_BASE_URL = 'http://localhost:8000/api'; // Assuming your Django backend runs on port 8000

export const API_ENDPOINTS = {
    COUNTRIES: `${API_BASE_URL}/countries/`,
    STATES: `${API_BASE_URL}/states/`,
    BUSINESSES: `${API_BASE_URL}/businesses/`,
    // Add other endpoints if your minimal version needs them
}; 