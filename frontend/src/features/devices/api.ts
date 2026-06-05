import api, { getStoredUser, unwrap } from '@/shared/api/httpClient';
import {
  ApiResponse,
  BackendCommand,
  BackendDevice,
  DeviceSummary,
} from '@/shared/api/backendTypes';
import { fanLevelToIntensity, toDeviceStatus } from '@/shared/api/mappers';
import { API_ENDPOINTS } from '@/utils/constants';
import { DeviceCommandPayload, DeviceCommandResponse, DeviceStatus } from '@/types';

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

  getDeviceSummaries: async (): Promise<DeviceSummary[]> => {
    const user = getStoredUser();
    return unwrap(
      await api.get<ApiResponse<DeviceSummary[]>>(API_ENDPOINTS.DEVICES_LIST(user.id))
    );
  },
};
