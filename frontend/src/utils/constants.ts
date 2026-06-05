import { FeedName } from '@/types';

// Feed Names - Mapping from IoT Gateway documentation
export const FEED_NAMES: Record<string, FeedName> = {
  TEMPERATURE: 'bbc-temp',
  HUMIDITY: 'bbc-humi',
  LIGHT: 'bbc-lux',
  DEVICE_STATUS: 'device-status',
  DEVICE_LIGHT: 'device-light',
  DEVICE_FAN: 'device-fan',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
  // Feeds
  FEEDS_LATEST: '/feeds/latest',
  FEEDS_HISTORY: '/feeds/history',
  
  // Devices
  DEVICE_COMMAND: (userId: string, id: string) => `/users/${userId}/devices/${id}/control`,
  DEVICES_LIST: (userId: string) => `/users/${userId}/devices`,
  
  // Auto Mode
  AUTO_MODE_CONFIG: '/auto-mode/config',
  AUTO_MODE_RULES: '/auto-mode/rules',
  
  // History
  HISTORY_LOGS: '/history/logs',
} as const;

// WebSocket Topics
export const WS_TOPICS = {
  FEEDS: '/ws/feeds',
  DEVICES: '/ws/devices',
  ALERTS: '/ws/alerts',
} as const;

// Sensor Thresholds
export const SENSOR_THRESHOLDS = {
  TEMPERATURE: {
    MIN: 15,
    MAX: 35,
    OPTIMAL_MIN: 20,
    OPTIMAL_MAX: 28,
  },
  HUMIDITY: {
    MIN: 30,
    MAX: 80,
    OPTIMAL_MIN: 40,
    OPTIMAL_MAX: 60,
  },
  LIGHT: {
    MIN: 0,
    MAX: 1000,
    OPTIMAL_MIN: 300,
    OPTIMAL_MAX: 700,
  },
} as const;

// Device IDs
export const DEVICE_IDS = {
  LIGHT_1: 'light-1',
  LIGHT_2: 'light-2',
  FAN: 'fan-1',
  AC: 'ac-1',
} as const;

// Fan Speed Levels
export const FAN_SPEEDS = [0, 1, 2, 3] as const;

// Refresh Intervals (ms)
export const REFRESH_INTERVALS = {
  REALTIME: 5000, // 5 giây - tránh rate limit Adafruit IO (30 req/min)
  NORMAL: 5000,
  SLOW: 30000,
} as const;

// Chart Colors (matching UI design)
export const CHART_COLORS = {
  TEMPERATURE: {
    border: '#2563eb',
    background: 'rgba(37, 99, 235, 0.1)',
  },
  HUMIDITY: {
    border: '#059669',
    background: 'rgba(5, 150, 105, 0.1)',
  },
  LIGHT: {
    border: '#d97706',
    background: 'rgba(217, 119, 6, 0.1)',
  },
} as const;

// Voice Control Keywords
export const VOICE_KEYWORDS = {
  TURN_ON: ['bật', 'mở', 'turn on', 'on'],
  TURN_OFF: ['tắt', 'đóng', 'turn off', 'off'],
  LIGHT: ['đèn', 'light', 'lamp'],
  FAN: ['quạt', 'fan'],
  SPEED: ['tốc độ', 'speed', 'level'],
  TEMPERATURE: ['nhiệt độ', 'temperature', 'temp'],
  HUMIDITY: ['độ ẩm', 'humidity'],
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'smart_classroom_token',
  USER_DATA: 'smart_classroom_user',
  THEME: 'smart_classroom_theme',
  AUTO_MODE_CONFIG: 'smart_classroom_auto_mode',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
  AUTH_FAILED: 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.',
  DEVICE_COMMAND_FAILED: 'Không thể gửi lệnh đến thiết bị. Vui lòng thử lại.',
  VOICE_NOT_SUPPORTED: 'Trình duyệt không hỗ trợ nhận diện giọng nói.',
  MALFORMED_DATA: 'Dữ liệu nhận được không hợp lệ.',
} as const;
