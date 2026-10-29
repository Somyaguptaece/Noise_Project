import axios from 'axios';

let rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');

// If the user specified an external host without /api, ensure /api is attached
if (rawBaseUrl.startsWith('http') && !rawBaseUrl.endsWith('/api')) {
  rawBaseUrl += '/api';
}

const api = axios.create({
  baseURL: rawBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Prevent Axios from stripping /api when request path has a leading slash
api.interceptors.request.use((reqConfig) => {
  if (reqConfig.baseURL && reqConfig.baseURL.endsWith('/api') && reqConfig.url && reqConfig.url.startsWith('/')) {
    reqConfig.url = reqConfig.url.replace(/^\/+/, '');
  }
  return reqConfig;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
