import apiClient from './axiosClient';
import type { AuthResponse, LoginRequest, RegistroRequest, Usuario } from '../types';

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegistroRequest): Promise<Usuario> {
    const response = await apiClient.post<Usuario>('/auth/registro', data);
    return response.data;
  },
};
