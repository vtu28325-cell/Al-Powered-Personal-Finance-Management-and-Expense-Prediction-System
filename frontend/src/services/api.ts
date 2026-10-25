
import axios from 'axios';

// Backend API URL from Vercel environment variables
const resolveApiBaseUrl = (): string => {
  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'https://al-powered-personal-finance-management.onrender.com/api/v1'
  ).trim();

  // Remove trailing slashes
  const cleanUrl = envUrl.replace(/\/+$/, '');

  if (cleanUrl.endsWith('/api/v1')) {
    return cleanUrl;
  }

  if (cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/v1`;
  }

  return `${cleanUrl}/api/v1`;
};

const API_BASE_URL = resolveApiBaseUrl();

// Print the API URL for debugging in the browser console
console.log('API BASE URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests after login
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('finance_access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? '';

      const isAuthRoute =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register');

      if (!isAuthRoute) {
        localStorage.removeItem('finance_access_token');
        localStorage.removeItem('finance_user');
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);
