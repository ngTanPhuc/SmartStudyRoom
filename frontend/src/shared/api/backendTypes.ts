export interface ApiResponse<T> {
  code: number;
  message: string;
  timestamp?: string;
  result: T;
}

export interface BackendUser {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  createdAt?: string;
  lastUpdated?: string;
  lastLogin?: string;
  roles?: string[];
}

export interface UserProfilePayload {
  email?: string;
  phone?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  password?: string;
}

export interface AdminUserSummary extends BackendUser {}

export interface BackendAuthResult {
  token: string;
}

export interface BackendSensor {
  id: string;
  sensorType: 'TEMPERATURE' | 'HUMIDITY' | 'LIGHT';
  currentValue?: number;
}

export interface BackendSensorData {
  timestamp: string;
  value: number;
}

export interface BackendDevice {
  id: string;
  deviceType: 'FAN' | 'LIGHT';
  intensityLevel: number;
}

export type AutoRuleOperator = 'EQ' | 'NEQ' | 'LT' | 'GT' | 'LE' | 'GE';

export interface SensorSummary {
  id: string;
  sensorType: BackendSensor['sensorType'];
  currentValue?: number;
}

export interface DeviceSummary {
  id: string;
  deviceType: BackendDevice['deviceType'];
  intensityLevel: number;
}

export interface AutoRuleSummary {
  id: string;
  description: string;
  active: boolean;
  operator: AutoRuleOperator;
  thresh: number;
  sensorResponse: SensorSummary;
  deviceResponse: DeviceSummary;
  targetValue: number;
  deletedAt?: string | null;
}

export interface AutoRulePayload {
  sensorId: string;
  deviceId: string;
  operator: AutoRuleOperator;
  thresh: number;
  targetValue: number;
}

export interface AutoRuleUpdatePayload {
  operator?: AutoRuleOperator;
  thresh?: number;
  targetValue?: number;
  active?: boolean;
}

export interface BackendCommand {
  id: string;
  commandType: 'MANUAL' | 'AUTO_RULE' | 'SPEECH';
  device: BackendDevice;
  previousIntensity: number;
  currentIntensity: number;
  autoRuleId?: string | null;
  speechInputId?: string | null;
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
