import axios from 'axios';

// Get base backend URL with fallback to live Render backend
const getApiBaseUrl = () => {
  let rawUrl = import.meta.env.VITE_API_URL;

  // In browser production mode on Vercel, fallback to live Render backend if unset
  if (!rawUrl || rawUrl === '/' || rawUrl === '/api') {
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      rawUrl = 'https://mern-task-lds4.onrender.com';
    } else {
      return '/api';
    }
  }

  const cleanUrl = rawUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling 401 Unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
