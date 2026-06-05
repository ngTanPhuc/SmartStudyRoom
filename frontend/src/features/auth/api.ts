import api, { getStoredUser, unwrap } from '@/shared/api/httpClient';
import { ApiResponse, BackendAuthResult, BackendUser, UserProfilePayload } from '@/shared/api/backendTypes';
import { toFrontendUser } from '@/shared/api/mappers';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/utils/constants';
import { AuthResponse, LoginCredentials, RegisterData } from '@/types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const auth = unwrap(await api.post<ApiResponse<BackendAuthResult>>(API_ENDPOINTS.LOGIN, {
      identifier: credentials.email,
      password: credentials.password,
    }));

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, auth.token);

    const user = toFrontendUser(unwrap(await api.get<ApiResponse<BackendUser>>('/users/my-info')));
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    return { token: auth.token, user };
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    await api.post(API_ENDPOINTS.REGISTER, {
      email: data.email,
      password: data.password,
      phone: data.phone,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
    });

    return authApi.login({
      email: data.email,
      password: data.password,
    });
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      await api.post(API_ENDPOINTS.LOGOUT, { token });
    }

    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  getMyInfo: async () => {
    const user = toFrontendUser(unwrap(await api.get<ApiResponse<BackendUser>>('/users/my-info')));
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return user;
  },

  updateProfile: async (payload: UserProfilePayload) => {
    const currentUser = getStoredUser();
    const user = toFrontendUser(
      unwrap(await api.put<ApiResponse<BackendUser>>(`/users/${currentUser.id}`, payload))
    );
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    return user;
  },
};
