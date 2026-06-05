import {
  Droplets,
  Fan,
  Lightbulb,
  SunMedium,
  Thermometer,
  type LucideIcon,
} from 'lucide-react';
import type {
  AutoRuleOperator,
  AutoRulePayload,
  DeviceSummary,
  SensorSummary,
} from '@/services/api';

export const OPERATOR_OPTIONS: Array<{ value: AutoRuleOperator; label: string }> = [
  { value: 'GT', label: 'Lớn hơn' },
  { value: 'LT', label: 'Bé hơn' },
];

export const OPERATOR_LABELS: Record<AutoRuleOperator, string> = {
  GT: 'lớn hơn',
  GE: 'lớn hơn hoặc bằng',
  LT: 'bé hơn',
  LE: 'bé hơn hoặc bằng',
  EQ: 'bằng',
  NEQ: 'khác',
};

export const SENSOR_CONFIG: Record<
  SensorSummary['sensorType'],
  { label: string; unit: string; icon: LucideIcon; tone: string; softTone: string }
> = {
  TEMPERATURE: {
    label: 'Nhiệt độ',
    unit: '°C',
    icon: Thermometer,
    tone: 'text-rose-600 dark:text-rose-300',
    softTone: 'bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900',
  },
  HUMIDITY: {
    label: 'Độ ẩm',
    unit: '%',
    icon: Droplets,
    tone: 'text-sky-600 dark:text-sky-300',
    softTone: 'bg-sky-50 border-sky-100 dark:bg-sky-950/30 dark:border-sky-900',
  },
  LIGHT: {
    label: 'Ánh sáng',
    unit: 'lux',
    icon: SunMedium,
    tone: 'text-amber-600 dark:text-amber-300',
    softTone: 'bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900',
  },
};

export const DEVICE_CONFIG: Record<
  DeviceSummary['deviceType'],
  { label: string; icon: LucideIcon; tone: string; softTone: string }
> = {
  FAN: {
    label: 'Quạt',
    icon: Fan,
    tone: 'text-emerald-600 dark:text-emerald-300',
    softTone: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900',
  },
  LIGHT: {
    label: 'Đèn',
    icon: Lightbulb,
    tone: 'text-yellow-600 dark:text-yellow-300',
    softTone: 'bg-yellow-50 border-yellow-100 dark:bg-yellow-950/30 dark:border-yellow-900',
  },
};

export const emptyForm: AutoRulePayload = {
  sensorId: '',
  deviceId: '',
  operator: 'GT',
  thresh: 30,
  targetValue: 100,
};

export const formatNumber = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '--';
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
};

export const fanIntensityToSpeed = (value: number) => {
  if (value <= 0) return 1;
  if (value <= 33) return 1;
  if (value <= 66) return 2;
  return 3;
};

export const fanSpeedToIntensity = (speed: number) => {
  if (speed <= 1) return 33;
  if (speed === 2) return 66;
  return 100;
};

export const describeDeviceValue = (deviceType: DeviceSummary['deviceType'], value: number) => {
  if (value <= 0) {
    return 'Tắt';
  }

  if (deviceType === 'FAN') {
    return `Bật - tốc độ ${fanIntensityToSpeed(value)}`;
  }

  return 'Bật';
};
