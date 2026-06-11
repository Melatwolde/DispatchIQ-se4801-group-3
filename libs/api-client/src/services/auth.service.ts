import api from '../lib/axios-instance';
import { handleApiError } from '../lib/error-handler';
import { LoginRequest, RegisterRequest, AuthResponse } from '@dispatchiq/types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
     
      const response = await api.post<AuthResponse>('/auth/login', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      
      const response = await api.post<AuthResponse>('/auth/register', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      
    }
  },
};