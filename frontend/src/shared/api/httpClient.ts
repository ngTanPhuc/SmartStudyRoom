import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ERROR_MESSAGES, STORAGE_KEYS } from '@/utils/constants';
import { ApiResponse, BackendUser } from './backendTypes';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
    }

    if (!error.response) {
      console.error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    return Promise.reject(error);
  }
);

export const unwrap = <T>(response: { data: ApiResponse<T> }): T => response.data.result;

export const getStoredUser = () => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (!userData) {
    throw new Error('Chưa đăng nhập');
  }
  return JSON.parse(userData) as BackendUser;
};

export default api;
