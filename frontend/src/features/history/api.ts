import api, { getStoredUser, unwrap } from '@/shared/api/httpClient';
import { ApiResponse, BackendCommand } from '@/shared/api/backendTypes';
import { describeCommandAction } from '@/shared/api/mappers';
import { HistoryLog } from '@/types';

export const historyApi = {
  getLogs: async (params?: {
    from?: string;
    to?: string;
    device?: string;
    status?: string;
  }): Promise<HistoryLog[]> => {
    const user = getStoredUser();
    const commands = unwrap(
      await api.get<ApiResponse<BackendCommand[]>>(`/users/${user.id}/commands`, { params })
    );

    return commands.map((command) => ({
      id: command.id,
      timestamp: command.createdAt,
      device: command.device.deviceType === 'FAN' ? 'Quạt' : 'Đèn',
      deviceType: command.device.deviceType === 'FAN' ? 'fan' : 'light',
      action: describeCommandAction(command),
      status: 'success',
      triggeredBy:
        command.commandType === 'AUTO_RULE'
          ? 'auto'
          : command.commandType === 'SPEECH'
            ? 'voice'
            : 'manual',
      autoRuleId: command.autoRuleId,
      speechInputId: command.speechInputId,
    }));
  },
};
