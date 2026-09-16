import apiClient from './axiosClient';
import type { ChangePasswordRequest, MedioPagoRequest, MedioPagoResumen, UpdateMeRequest, Usuario } from '../types';

export const usuariosApi = {
  async obtenerPerfil(): Promise<Usuario> {
    const response = await apiClient.get<Usuario>('/usuarios/me');
    return response.data;
  },

  async actualizarPerfil(data: UpdateMeRequest): Promise<Usuario> {
    const response = await apiClient.patch<Usuario>('/usuarios/me', data);
    return response.data;
  },

  async cambiarPassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  },

  async listarMediosPago(): Promise<MedioPagoResumen[]> {
    const response = await apiClient.get<MedioPagoResumen[]>('/usuarios/me/medios-pago');
    return response.data;
  },

  async agregarMedioPago(data: MedioPagoRequest): Promise<MedioPagoResumen> {
    const response = await apiClient.post<MedioPagoResumen>('/usuarios/me/medios-pago', data);
    return response.data;
  },

  async eliminarMedioPago(id: number): Promise<void> {
    await apiClient.delete(`/usuarios/me/medios-pago/${id}`);
  },
};
