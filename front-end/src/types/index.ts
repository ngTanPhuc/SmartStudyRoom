// Feed Types - Based on IoT Gateway documentation
export type FeedName = 'bbc-temp' | 'bbc-humi' | 'bbc-lux' | 'device-status' | 'device-light' | 'device-fan';

export interface FeedData {
  value: number | string;
  timestamp: string;
}

export interface LatestFeedsResponse {
  [key: string]: FeedData;
}

export interface HistoricalDataPoint {
  timestamp: string;
  value: number;
}

export interface HistoryQueryParams {
  feed: FeedName;
  from?: string;
  to?: string;
  limit?: number;
}

// Device Control Types
export type DeviceCommand = 'turn_on' | 'turn_off' | 'fan_speed' | 'set_threshold';

export interface DeviceCommandPayload {
  command: DeviceCommand;
  value?: number | string;
  requestedBy?: string;
}

export interface DeviceCommandResponse {
  status: 'ok' | 'error';
  appliedAt?: string;
  message?: string;
}

// Sensor Data Types
export interface SensorReading {
  temperature: number;
  humidity: number;
  light: number;
  timestamp: string;
}

// Device Status Types
export interface DeviceStatus {
  id: string;
  name: string;
  type: 'light' | 'fan' | 'sensor';
  status: 'on' | 'off' | 'error';
  value?: number;
  lastUpdate: string;
}

// Auto Mode Types
export interface ThresholdRule {
  id: string;
  feed: FeedName;
  condition: 'greater_than' | 'less_than' | 'equals';
  threshold: number;
  action: DeviceCommand;
  deviceId: string;
  enabled: boolean;
}

export interface AutoModeConfig {
  enabled: boolean;
  rules: ThresholdRule[];
}

// History Log Types
export interface HistoryLog {
  id: string;
  timestamp: string;
  device: string;
  action: string;
  status: 'success' | 'failed' | 'pending';
  triggeredBy: 'manual' | 'auto' | 'voice';
  details?: string;
}

// Voice Control Types
export interface VoiceTranscript {
  text: string;
  confidence: number;
  keywords: string[];
  timestamp: string;
}

export interface VoiceCommand {
  transcript: VoiceTranscript;
  parsedCommand?: DeviceCommandPayload;
  status: 'idle' | 'listening' | 'processing' | 'success' | 'error';
  error?: string;
}

// WebSocket Event Types
export interface WSFeedEvent {
  topic: FeedName;
  value: number | string;
  timestamp: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  roles?: string[];
}

// Connection Status
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

// UI State Types
export interface DashboardState {
  connectionStatus: ConnectionStatus;
  latestReadings: SensorReading | null;
  devices: DeviceStatus[];
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp: string;
  dismissed: boolean;
}

// Chart Data Types
export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
}

export interface ChartConfig {
  labels: string[];
  datasets: ChartDataset[];
}
