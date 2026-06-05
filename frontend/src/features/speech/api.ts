import api, { getStoredUser, unwrap } from '@/shared/api/httpClient';
import { ApiResponse, SpeechControlResult } from '@/shared/api/backendTypes';

export const speechApi = {
  process: async (rawtext: string): Promise<SpeechControlResult> => {
    const user = getStoredUser();
    return unwrap(
      await api.post<ApiResponse<SpeechControlResult>>(
        `/users/${user.id}/speech-inputs/predict`,
        { rawtext }
      )
    );
  },

  getHistory: async (): Promise<SpeechControlResult[]> => {
    const user = getStoredUser();
    const history = unwrap(
      await api.get<ApiResponse<SpeechControlResult[]>>(`/users/${user.id}/speech-inputs`)
    );

    return [...history].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
};
