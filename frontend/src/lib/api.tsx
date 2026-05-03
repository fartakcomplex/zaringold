import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  try {
    const store = JSON.parse(localStorage.getItem('zarrin-gold-store') || '{}');
    const token = store?.state?.user?.sessionToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore parse errors
  }
  return config;
});

// Handle 401 responses — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state on unauthorized
      try {
        localStorage.removeItem('zarrin-gold-store');
      } catch {
        // Ignore
      }
      // Don't auto-redirect in SPA — let the app handle it
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Helper to make API calls that work with both the Django backend
 * and fallback to the same path for development proxy.
 */
export async function apiGet<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  const response = await api.get<T>(path, { params });
  return response.data;
}

export async function apiPost<T = any>(path: string, data?: any): Promise<T> {
  const response = await api.post<T>(path, data);
  return response.data;
}

export async function apiPut<T = any>(path: string, data?: any): Promise<T> {
  const response = await api.put<T>(path, data);
  return response.data;
}

export async function apiPatch<T = any>(path: string, data?: any): Promise<T> {
  const response = await api.patch<T>(path, data);
  return response.data;
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const response = await api.delete<T>(path);
  return response.data;
}
