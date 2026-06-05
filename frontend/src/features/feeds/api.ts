import api, { getStoredUser, unwrap } from '@/shared/api/httpClient';
import { ApiResponse, BackendSensor, BackendSensorData } from '@/shared/api/backendTypes';
import { feedToSensorType, sensorTypeToFeed } from '@/shared/api/mappers';
import { HistoricalDataPoint, HistoryQueryParams, LatestFeedsResponse } from '@/types';

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

  deleteHistory: async (params: { feed: string; from?: string; to?: string }): Promise<number> => {
    const user = getStoredUser();
    const sensorType = feedToSensorType(params.feed);
    const sensors = unwrap(await api.get<ApiResponse<BackendSensor[]>>(`/users/${user.id}/sensors`));
    const sensor = sensors.find((item) => item.sensorType === sensorType);
    if (!sensor) {
      throw new Error('Không tìm thấy cảm biến cần xóa dữ liệu');
    }

    return unwrap(
      await api.delete<ApiResponse<number>>(`/users/${user.id}/sensors/${sensor.id}/data`, {
        params: {
          ...(params.from ? { from: params.from } : {}),
          ...(params.to ? { to: params.to } : {}),
        },
      })
    );
  },
};
