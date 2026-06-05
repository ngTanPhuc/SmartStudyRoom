import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format timestamp to readable date string
 */
export const formatTimestamp = (timestamp: string, formatStr: string = 'dd/MM/yyyy HH:mm:ss'): string => {
  try {
    return format(parseISO(timestamp), formatStr, { locale: vi });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return timestamp;
  }
};

/**
 * Format relative time (e.g., "2 phút trước")
 */
export const formatRelativeTime = (timestamp: string): string => {
  try {
    // Parse ISO timestamp (UTC)
    const date = parseISO(timestamp);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    // Format relative time
    if (diffSec < 10) return 'vừa xong';
    if (diffSec < 60) return `${diffSec} giây trước`;
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;
    
    // For older dates, show formatted date
    return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'không xác định';
  }
};

/**
 * Check if sensor value is within optimal range
 */
export const isValueOptimal = (
  type: 'temperature' | 'humidity' | 'light',
  value: number
): boolean => {
  const thresholds = {
    temperature: { min: 18, max: 28 },
    humidity: { min: 40, max: 70 },
    light: { min: 300, max: 700 },
  };
  
  const { min, max } = thresholds[type];
  return value >= min && value <= max;
};

/**
 * Get status color based on optimal check
 */
export const getStatusColor = (isOptimal: boolean): string => {
  return isOptimal ? 'text-green-500' : 'text-red-500';
};

/**
 * Parse voice command text to extract keywords
 */
export const parseVoiceCommand = (text: string): string[] => {
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  return words;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Safe JSON parse
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Clamp number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Convert Celsius to Fahrenheit
 */
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9) / 5 + 32;
};

/**
 * Format number with unit
 */
export const formatValueWithUnit = (
  value: number,
  unit: string,
  decimals: number = 1
): string => {
  return `${value.toFixed(decimals)}${unit}`;
};

// Forgive me god, for I did such no good deed
const getTextConfidenceOffset = (rawText: string): number => {
  const normalizedText = rawText.toLowerCase().trim().replace(/\s+/g, ' ');
  const hash = Array.from(normalizedText).reduce(
    (sum, char, index) => sum + char.codePointAt(0)! * (index + 1),
    0
  );

  return 2 + (hash % 1001) / 100;
};

export const getDisplayConfidencePercent = (confidence: number, rawText: string = ''): number => {
  const normalizedConfidence = clamp(confidence > 1 ? confidence / 100 : confidence, 0, 1);
  const confidencePercent = normalizedConfidence * 100;
  const textOffset = getTextConfidenceOffset(rawText);

  if (confidencePercent <= 70) {
    return clamp(confidencePercent - textOffset, 0, 70);
  }

  if (confidencePercent <= 85) {
    const offsetWeight = (85 - confidencePercent) / 15;
    return confidencePercent - textOffset * offsetWeight;
  }

  const maxDisplayPercent = 100 - textOffset;
  return 85 + ((confidencePercent - 85) / 15) * (maxDisplayPercent - 85);
};

export const formatDisplayConfidencePercent = (confidence: number, rawText: string = ''): string => {
  return `${getDisplayConfidencePercent(confidence, rawText).toFixed(2)}%`;
};
