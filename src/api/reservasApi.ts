import apiClient from './axiosClient';
import { params } from './catalogoApi';
import type {
  AdminReservaRequest,
  AgendaPiso,
  Bloqueo,
  ClienteRef,
  CrearBloqueoRequest,
  FiltroReservas,
  MisReservas,
  PaginaReservas,
  Reserva,
} from '../types/reservas';

export const reservasApi = {
  async crear(espacioId: number, inicio: string, fin: string): Promise<Reserva> {
    return (await apiClient.post<Reserva>('/reservas', { espacioId, inicio, fin })).data;
  },

  async mias(): Promise<MisReservas> {
    return (await apiClient.get<MisReservas>('/reservas/mias')).data;
  },

  async detalle(id: number): Promise<Reserva> {
    return (await apiClient.get<Reserva>(`/reservas/${id}`)).data;
  },

  async cancelar(id: number): Promise<Reserva> {
    return (await apiClient.patch<Reserva>(`/reservas/${id}/cancelar`)).data;
  },
};

export const adminApi = {
  async reservas(filtro: FiltroReservas): Promise<PaginaReservas> {
    return (await apiClient.get<PaginaReservas>('/admin/reservas', { params: params(filtro) })).data;
  },

  async agenda(pisoId: number, fecha: string): Promise<AgendaPiso> {
    return (await apiClient.get<AgendaPiso>('/admin/agenda', { params: { pisoId, fecha } })).data;
  },

  async crearReserva(data: AdminReservaRequest): Promise<Reserva> {
    return (await apiClient.post<Reserva>('/admin/reservas', data)).data;
  },

  async actualizarReserva(id: number, data: AdminReservaRequest): Promise<Reserva> {
    return (await apiClient.put<Reserva>(`/admin/reservas/${id}`, data)).data;
  },

  async eliminarReserva(id: number): Promise<void> {
    await apiClient.delete(`/admin/reservas/${id}`);
  },

  async buscarClientes(q: string): Promise<ClienteRef[]> {
    return (await apiClient.get<ClienteRef[]>('/admin/clientes', { params: { q } })).data;
  },

  async bloqueos(): Promise<Bloqueo[]> {
    return (await apiClient.get<Bloqueo[]>('/admin/bloqueos')).data;
  },

  async crearBloqueo(data: CrearBloqueoRequest): Promise<{ grupo: string; cantidad: number; bloqueos: Bloqueo[] }> {
    return (await apiClient.post('/admin/bloqueos', data)).data;
  },

  async eliminarBloqueo(id: number, grupo: boolean): Promise<void> {
    await apiClient.delete(`/admin/bloqueos/${id}`, { params: { grupo } });
  },
};
