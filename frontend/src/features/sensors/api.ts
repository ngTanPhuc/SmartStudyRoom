import api, { getStoredUser, unwrap } from '@/shared/api/httpClient';
import { ApiResponse, SensorSummary } from '@/shared/api/backendTypes';

export const sensorApi = {
  getSensors: async (): Promise<SensorSummary[]> => {
    const user = getStoredUser();
    return unwrap(await api.get<ApiResponse<SensorSummary[]>>(`/users/${user.id}/sensors`));
  },
};
