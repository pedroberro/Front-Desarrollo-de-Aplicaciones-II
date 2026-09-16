import apiClient from './axiosClient';
import type { AuthResponse, ForgotPasswordRequest, LoginRequest, RegistroRequest, ResetPasswordRequest, Usuario } from '../types';

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegistroRequest): Promise<Usuario> {
    const response = await apiClient.post<Usuario>('/auth/register', data);
    return response.data;
  },

  async confirmarEmail(token: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/confirmar-email', { token });
    return response.data;
  },

  async reenviarConfirmacion(email: string): Promise<void> {
    await apiClient.post('/auth/reenviar-confirmacion', { email });
  },

  async emailDisponible(email: string, signal?: AbortSignal): Promise<boolean> {
    const response = await apiClient.post<{ disponible: boolean }>('/auth/email-disponible', { email }, { signal });
    return response.data.disponible;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', data);
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.post('/auth/reset-password', data);
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
