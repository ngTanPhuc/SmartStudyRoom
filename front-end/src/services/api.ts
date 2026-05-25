/**
 * API Service Layer
 * 
 * Responsibilities:
 * - Configure axios instance with base URL and interceptors
 * - Attach JWT token to requests automatically
 * - Handle token refresh and authentication errors
 * - Provide typed API methods for all endpoints
 * 
 * Expected Data Format:
 * - All requests/responses follow REST conventions
 * - Timestamps in ISO 8601 format
 * - Feed values can be number or string depending on device type
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  LatestFeedsResponse,
  HistoricalDataPoint,
  HistoryQueryParams,
  DeviceCommandPayload,
  DeviceCommandResponse,
  DeviceStatus,
  AutoModeConfig,
  HistoryLog,
} from '@/types';
import { API_ENDPOINTS, STORAGE_KEYS, ERROR_MESSAGES } from '@/utils/constants';

interface ApiResponse<T> {
  code: number;
  message: string;
  timestamp?: string;
  result: T;
}

interface BackendUser {
  id: string;
  email: string;
  phone?: string;
  fullName?: string;
  roles?: string[];
}

interface BackendAuthResult {
  token: string;
}

interface BackendSensor {
  id: string;
  sensorType: 'TEMPERATURE' | 'HUMIDITY' | 'LIGHT';
  currentValue?: number;
}

interface BackendSensorData {
  timestamp: string;
  value: number;
}

interface BackendDevice {
  id: string;
  deviceType: 'FAN' | 'LIGHT';
  intensityLevel: number;
}

interface BackendCommand {
  id: string;
  commandType: 'MANUAL' | 'AUTO_RULE' | 'SPEECH';
  device: BackendDevice;
  previousIntensity: number;
  currentIntensity: number;
  createdAt: string;
}

export interface SpeechControlResult {
  id: string;
  rawtext: string;
  predictLabel: string;
  confidence: number;
  createdAt: string;
  device?: BackendDevice;
  targetValue?: number;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor - Attach JWT token
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Handle errors and token expiration
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      window.location.href = '/login';
    }
    
    if (!error.response) {
      // Network error
      console.error(ERROR_MESSAGES.NETWORK_ERROR);
    }
    
    return Promise.reject(error);
  }
);

const unwrap = <T>(response: { data: ApiResponse<T> }): T => response.data.result;

const getStoredUser = () => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  if (!userData) {
    throw new Error('Chưa đăng nhập');
  }
  return JSON.parse(userData) as BackendUser;
};

const toFrontendUser = (user: BackendUser) => {
  const names = (user.fullName || '').trim().split(/\s+/);
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    firstName: names.slice(0, -1).join(' ') || user.fullName || user.email,
    lastName: names.slice(-1).join(' '),
    username: user.email?.split('@')[0] || user.id,
    roles: user.roles,
  };
};

const sensorTypeToFeed = (sensorType: BackendSensor['sensorType']) => {
  switch (sensorType) {
    case 'TEMPERATURE':
      return 'bbc-temp';
    case 'HUMIDITY':
      return 'bbc-humi';
    case 'LIGHT':
      return 'bbc-lux';
  }
};

const feedToSensorType = (feed: string): BackendSensor['sensorType'] => {
  switch (feed) {
    case 'bbc-temp':
      return 'TEMPERATURE';
    case 'bbc-humi':
      return 'HUMIDITY';
    case 'bbc-lux':
      return 'LIGHT';
    default:
      throw new Error(`Unsupported feed: ${feed}`);
  }
};

const fanIntensityToLevel = (intensity: number) => {
  if (intensity <= 0) return 0;
  if (intensity <= 33) return 1;
  if (intensity <= 66) return 2;
  return 3;
};

const fanLevelToIntensity = (level: number) => {
  if (level <= 0) return 0;
  if (level === 1) return 33;
  if (level === 2) return 66;
  return 100;
};

const toDeviceStatus = (device: BackendDevice): DeviceStatus => {
  const isFan = device.deviceType === 'FAN';
  const value = isFan ? fanIntensityToLevel(device.intensityLevel) : device.intensityLevel;
  return {
    id: device.id,
    name: isFan ? 'Quạt' : 'Đèn',
    type: isFan ? 'fan' : 'light',
    status: device.intensityLevel > 0 ? 'on' : 'off',
    value,
    lastUpdate: new Date().toISOString(),
  };
};

/**
 * Authentication APIs
 */
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const auth = unwrap(await api.post<ApiResponse<BackendAuthResult>>(API_ENDPOINTS.LOGIN, {
      identifier: credentials.email,
      password: credentials.password,
    }));
    
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, auth.token);

    const user = toFrontendUser(unwrap(await api.get<ApiResponse<BackendUser>>('/users/my-info')));
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    
    return { token: auth.token, user };
  },
  
  register: async (data: RegisterData): Promise<AuthResponse> => {
    await api.post<ApiResponse<BackendUser>>(API_ENDPOINTS.REGISTER, {
      email: data.email,
      password: data.password,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    return authApi.login({
      email: data.email,
      password: data.password,
    });
  },
  
  logout: async (): Promise<void> => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      await api.post(API_ENDPOINTS.LOGOUT, { token });
    }

    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },
};

/**
 * Feed APIs
 * 
 * Example Response for GET /api/feeds/latest:
 * {
 *   "bbc-temp": { "value": 28.5, "timestamp": "2026-03-02T15:30:00Z" },
 *   "bbc-humi": { "value": 62, "timestamp": "2026-03-02T15:30:00Z" },
 *   "bbc-lux": { "value": 450, "timestamp": "2026-03-02T15:30:00Z" }
 * }
 */
export const feedApi = {
  getLatest: async (): Promise<LatestFeedsResponse> => {
    const user = getStoredUser();
    const sensors = unwrap(await api.get<ApiResponse<BackendSensor[]>>(`/users/${user.id}/sensors`));
    const now = new Date().toISOString();

    return sensors.reduce<LatestFeedsResponse>((acc, sensor) => {
      acc[sensorTypeToFeed(sensor.sensorType)] = {
        value: sensor.currentValue ?? 0,
        timestamp: now,
      };
      return acc;
    }, {});
  },
  
  getHistory: async (params: HistoryQueryParams): Promise<HistoricalDataPoint[]> => {
    const user = getStoredUser();
    const sensorType = feedToSensorType(params.feed);
    const sensors = unwrap(await api.get<ApiResponse<BackendSensor[]>>(`/users/${user.id}/sensors`));
    const sensor = sensors.find((item) => item.sensorType === sensorType);
    if (!sensor) return [];

    const data = unwrap(
      await api.get<ApiResponse<BackendSensorData[]>>(`/users/${user.id}/sensors/${sensor.id}/data`)
    );

    return data
      .map((item) => ({
        timestamp: item.timestamp,
        value: Number(item.value),
      }))
      .slice(0, params.limit ?? data.length);
  },
};

/**
 * Device Control APIs
 * 
 * Example Request for POST /api/device/:id/command:
 * {
 *   "command": "turn_on",
 *   "value": 1,
 *   "requestedBy": "vi"
 * }
 * 
 * Example Response:
 * {
 *   "status": "ok",
 *   "appliedAt": "2026-03-02T15:30:05Z",
 *   "message": "Command executed successfully"
 * }
 */
export const deviceApi = {
  sendCommand: async (
    deviceId: string,
    payload: DeviceCommandPayload
  ): Promise<DeviceCommandResponse> => {
    const user = getStoredUser();
    const targetValue = payload.command === 'fan_speed'
      ? fanLevelToIntensity(Number(payload.value ?? 0))
      : payload.command === 'turn_on'
      ? 100
      : 0;

    const command = unwrap(
      await api.post<ApiResponse<BackendCommand>>(
        API_ENDPOINTS.DEVICE_COMMAND(user.id, deviceId),
        { targetValue }
      )
    );

    return {
      status: 'ok',
      appliedAt: command.createdAt,
      message: 'Command executed successfully',
    };
  },
  
  getDevices: async (): Promise<DeviceStatus[]> => {
    const user = getStoredUser();
    const devices = unwrap(
      await api.get<ApiResponse<BackendDevice[]>>(API_ENDPOINTS.DEVICES_LIST(user.id))
    );
    return devices.map(toDeviceStatus);
  },
};

/**
 * Speech Control APIs
 */
export const speechApi = {
  process: async (rawtext: string): Promise<SpeechControlResult> => {
    const user = getStoredUser();
    return unwrap(
      await api.post<ApiResponse<SpeechControlResult>>(
        `/users/${user.id}/speech-inputs/predict`,
        { rawtext }
      )
    );
  },
};

/**
 * Auto Mode APIs
 */
export const autoModeApi = {
  getConfig: async (): Promise<AutoModeConfig> => {
    const response = await api.get<AutoModeConfig>(API_ENDPOINTS.AUTO_MODE_CONFIG);
    return response.data;
  },
  
  updateConfig: async (config: AutoModeConfig): Promise<AutoModeConfig> => {
    const response = await api.put<AutoModeConfig>(
      API_ENDPOINTS.AUTO_MODE_CONFIG,
      config
    );
    return response.data;
  },
};

/**
 * History APIs
 */
export const historyApi = {
  getLogs: async (params?: {
    from?: string;
    to?: string;
    device?: string;
    status?: string;
  }): Promise<HistoryLog[]> => {
    const user = getStoredUser();
    const commands = unwrap(
      await api.get<ApiResponse<BackendCommand[]>>(`/users/${user.id}/commands`, { params })
    );

    return commands.map((command) => ({
      id: command.id,
      timestamp: command.createdAt,
      device: command.device.deviceType === 'FAN' ? 'Quạt' : 'Đèn',
      action: `${command.previousIntensity} -> ${command.currentIntensity}`,
      status: 'success',
      triggeredBy:
        command.commandType === 'AUTO_RULE'
          ? 'auto'
          : command.commandType === 'SPEECH'
          ? 'voice'
          : 'manual',
    }));
  },
};

export default api;
