import axios from 'axios';

/**
 * Centralized Axios Instance for RentNest
 * - Connects to Express backend
 * - Automatically attaches JWT token to headers for authenticated endpoints
 * - Handles unauthorized 401 token expirations gracefully
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Request Interceptor: Attach JWT Bearer Token if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rentnest_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (e.g. expired tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is invalid or expired, clear storage
      const token = localStorage.getItem('rentnest_token');
      if (token) {
        localStorage.removeItem('rentnest_token');
        localStorage.removeItem('rentnest_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

