import {
  BackendCommand,
  BackendDevice,
  BackendSensor,
  BackendUser,
} from './backendTypes';
import { DeviceStatus } from '@/types';

export const toFrontendUser = (user: BackendUser) => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  fullName: user.fullName,
  firstName: user.firstName,
  middleName: user.middleName,
  lastName: user.lastName,
  username: user.email?.split('@')[0] || user.id,
  createdAt: user.createdAt,
  lastUpdated: user.lastUpdated,
  lastLogin: user.lastLogin,
  roles: user.roles,
});

export const sensorTypeToFeed = (sensorType: BackendSensor['sensorType']) => {
  switch (sensorType) {
    case 'TEMPERATURE':
      return 'bbc-temp';
    case 'HUMIDITY':
      return 'bbc-humi';
    case 'LIGHT':
      return 'bbc-lux';
  }
};

export const feedToSensorType = (feed: string): BackendSensor['sensorType'] => {
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

export const fanIntensityToLevel = (intensity: number) => {
  if (intensity <= 0) return 0;
  if (intensity <= 33) return 1;
  if (intensity <= 66) return 2;
  return 3;
};

export const fanLevelToIntensity = (level: number) => {
  if (level <= 0) return 0;
  if (level === 1) return 33;
  if (level === 2) return 66;
  return 100;
};

export const describeCommandAction = (command: BackendCommand) => {
  const previous = Number(command.previousIntensity || 0);
  const current = Number(command.currentIntensity || 0);

  if (command.device.deviceType === 'LIGHT') {
    return current > 0 ? 'Bật' : 'Tắt';
  }

  const previousSpeed = fanIntensityToLevel(previous);
  const currentSpeed = fanIntensityToLevel(current);

  if (currentSpeed === 0) {
    return 'Tắt';
  }

  if (previousSpeed === 0) {
    return `Bật - tốc độ ${currentSpeed}`;
  }

  if (previousSpeed !== currentSpeed) {
    return `Chỉnh tốc độ ${currentSpeed}`;
  }

  return `Đang bật - tốc độ ${currentSpeed}`;
};

export const toDeviceStatus = (device: BackendDevice): DeviceStatus => {
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
