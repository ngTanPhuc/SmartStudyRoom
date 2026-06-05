import type React from 'react';
import { Droplets, Sun, Thermometer } from 'lucide-react';
import { subDays, subMonths, subWeeks } from 'date-fns';
import type { FeedName } from '@/types';

export type SensorTypeParam = 'temperature' | 'humidity' | 'light';
export type ChartRange = 'day' | 'week' | 'month' | 'all';
export type SortOrder = 'desc' | 'asc';

export const SENSOR_CONFIG: Record<SensorTypeParam, {
  label: string;
  feed: FeedName;
  unit: string;
  icon: React.ElementType;
  accent: string;
  soft: string;
  chartColor: string;
  chartFill: string;
}> = {
  temperature: {
    label: 'Nhiệt độ',
    feed: 'bbc-temp',
    unit: '°C',
    icon: Thermometer,
    accent: 'from-blue-600 to-cyan-500',
    soft: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    chartColor: '#2563eb',
    chartFill: 'rgba(37, 99, 235, 0.12)',
  },
  humidity: {
    label: 'Độ ẩm',
    feed: 'bbc-humi',
    unit: '%',
    icon: Droplets,
    accent: 'from-emerald-600 to-teal-500',
    soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    chartColor: '#059669',
    chartFill: 'rgba(5, 150, 105, 0.12)',
  },
  light: {
    label: 'Ánh sáng',
    feed: 'bbc-lux',
    unit: 'lux',
    icon: Sun,
    accent: 'from-amber-500 to-orange-500',
    soft: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    chartColor: '#d97706',
    chartFill: 'rgba(217, 119, 6, 0.12)',
  },
};

export const isValidSensorType = (value: string | undefined): value is SensorTypeParam =>
  value === 'temperature' || value === 'humidity' || value === 'light';

export const getChartStartDate = (range: ChartRange) => {
  const now = new Date();
  if (range === 'day') return subDays(now, 1);
  if (range === 'week') return subWeeks(now, 1);
  if (range === 'month') return subMonths(now, 1);
  return null;
};

export const getChartLabelFormat = (range: ChartRange) => {
  if (range === 'day') return 'HH:mm';
  if (range === 'week') return 'dd/MM HH:mm';
  return 'dd/MM';
};
