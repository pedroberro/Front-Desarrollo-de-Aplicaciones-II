import apiClient from './axiosClient';
import type { AuthResponse, ChangePasswordRequest, MedioPagoRequest, MedioPagoResumen, MedioPagoUpdateRequest, UpdateMeRequest, Usuario } from '../types';

export const usuariosApi = {
  async obtenerPerfil(): Promise<Usuario> {
    const response = await apiClient.get<Usuario>('/usuarios/me');
    return response.data;
  },

  async actualizarPerfil(data: UpdateMeRequest): Promise<Usuario> {
    const response = await apiClient.patch<Usuario>('/usuarios/me', data);
    return response.data;
  },

  /** Other sessions end on the server; this one continues with the new token it returns. */
  async cambiarPassword(data: ChangePasswordRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/change-password', data);
    return response.data;
  },

  async listarMediosPago(): Promise<MedioPagoResumen[]> {
    const response = await apiClient.get<MedioPagoResumen[]>('/usuarios/me/medios-pago');
    return response.data;
  },

  async agregarMedioPago(data: MedioPagoRequest): Promise<MedioPagoResumen> {
    const response = await apiClient.post<MedioPagoResumen>('/usuarios/me/medios-pago', data);
    return response.data;
  },

  async actualizarMedioPago(id: number, data: MedioPagoUpdateRequest): Promise<MedioPagoResumen> {
    const response = await apiClient.put<MedioPagoResumen>(`/usuarios/me/medios-pago/${id}`, data);
    return response.data;
  },

  async marcarMedioPagoPrincipal(id: number): Promise<MedioPagoResumen[]> {
    const response = await apiClient.patch<MedioPagoResumen[]>(`/usuarios/me/medios-pago/${id}/principal`);
    return response.data;
  },

  async eliminarMedioPago(id: number): Promise<void> {
    await apiClient.delete(`/usuarios/me/medios-pago/${id}`);
  },
};
