import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Attach the stored JWT to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medeire_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear local auth state and hard-redirect to login.
// This handles expired or revoked tokens without needing a refresh flow.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medeire_token');
      localStorage.removeItem('medeire_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
