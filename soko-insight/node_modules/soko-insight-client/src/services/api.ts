import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';
import { offlineStorage } from '../utils/offlineStorage';
import { useAuthStore } from '../store/authStore';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and handle offline requests
api.interceptors.request.use(
  async (config) => {
    // Get token from auth store (which syncs with localStorage via persist)
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check if offline and queue POST/PUT/PATCH requests
    if (!offlineStorage.isOnline() && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      // Queue the request for later sync
      await offlineStorage.queueRequest({
        method: config.method.toUpperCase(),
        url: config.url || '',
        body: config.data,
        headers: config.headers as Record<string, string>,
      });

      // Return a rejected promise with a special error that can be caught by components
      return Promise.reject({
        isOffline: true,
        message: 'Request queued for sync when online',
        config,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    // Handle network errors (offline)
    if (!error.response && error.request) {
      // Network error - might be offline
      if (!offlineStorage.isOnline()) {
        return Promise.reject({
          isOffline: true,
          message: 'No internet connection. Please check your network.',
          originalError: error,
        });
      }
    }

    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth state via store
      useAuthStore.getState().logout();
      // Use navigate instead of window.location to avoid full page reload
      // The ProtectedRoute will handle redirecting to login
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper function to handle API errors
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.response?.data?.errors) {
      return axiosError.response.data.errors.map(e => e.message).join(', ');
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

