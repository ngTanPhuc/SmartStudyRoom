import api from '@/shared/api/httpClient';
import { API_ENDPOINTS } from '@/utils/constants';
import { AutoModeConfig } from '@/types';

export const autoModeApi = {
  getConfig: async (): Promise<AutoModeConfig> => {
    const response = await api.get<AutoModeConfig>(API_ENDPOINTS.AUTO_MODE_CONFIG);
    return response.data;
  },

  updateConfig: async (config: AutoModeConfig): Promise<AutoModeConfig> => {
    const response = await api.put<AutoModeConfig>(
      API_ENDPOINTS.AUTO_MODE_CONFIG,
      config
    );
    return response.data;
  },
};
