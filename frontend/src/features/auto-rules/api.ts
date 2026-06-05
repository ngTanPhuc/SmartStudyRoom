import api, { getStoredUser, unwrap } from '@/shared/api/httpClient';
import {
  ApiResponse,
  AutoRulePayload,
  AutoRuleSummary,
  AutoRuleUpdatePayload,
} from '@/shared/api/backendTypes';

export const autoRuleApi = {
  getRules: async (): Promise<AutoRuleSummary[]> => {
    const user = getStoredUser();
    return unwrap(await api.get<ApiResponse<AutoRuleSummary[]>>(`/users/${user.id}/auto-rules`));
  },

  getRule: async (ruleId: string): Promise<AutoRuleSummary> => {
    const user = getStoredUser();
    return unwrap(await api.get<ApiResponse<AutoRuleSummary>>(`/users/${user.id}/auto-rules/${ruleId}`));
  },

  createRule: async (payload: AutoRulePayload): Promise<AutoRuleSummary> => {
    const user = getStoredUser();
    return unwrap(
      await api.post<ApiResponse<AutoRuleSummary>>(`/users/${user.id}/auto-rules`, payload)
    );
  },

  updateRule: async (ruleId: string, payload: AutoRuleUpdatePayload): Promise<AutoRuleSummary> => {
    const user = getStoredUser();
    return unwrap(
      await api.put<ApiResponse<AutoRuleSummary>>(`/users/${user.id}/auto-rules/${ruleId}`, payload)
    );
  },

  deleteRule: async (ruleId: string): Promise<void> => {
    const user = getStoredUser();
    await api.delete(`/users/${user.id}/auto-rules/${ruleId}`);
  },
};
