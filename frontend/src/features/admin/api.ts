import api, { unwrap } from '@/shared/api/httpClient';
import { AdminUserSummary, ApiResponse, UserProfilePayload } from '@/shared/api/backendTypes';

export const adminApi = {
  getUsers: async (): Promise<AdminUserSummary[]> => {
    return unwrap(await api.get<ApiResponse<AdminUserSummary[]>>('/users'));
  },

  updateUser: async (userId: string, payload: UserProfilePayload): Promise<AdminUserSummary> => {
    return unwrap(await api.put<ApiResponse<AdminUserSummary>>(`/users/${userId}`, payload));
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },
};
