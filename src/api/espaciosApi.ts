import apiClient from './axiosClient';
import type { Espacio, PageResponse, Sede, TipoEspacio, EspaciosFilters } from '../types';

export const espaciosApi = {
  async buscar(filters: EspaciosFilters = {}): Promise<PageResponse<Espacio>> {
    const params = new URLSearchParams();
    if (filters.sede) params.append('sede', filters.sede);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.capacidad) params.append('capacidad', filters.capacidad.toString());
    if (filters.fecha) params.append('fecha', filters.fecha);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size) params.append('size', filters.size.toString());

    const response = await apiClient.get<PageResponse<Espacio>>(`/espacios?${params.toString()}`);
    return response.data;
  },

  async listarSedes(): Promise<Sede[]> {
    const response = await apiClient.get<Sede[]>('/sedes');
    return response.data;
  },

  async listarTipos(): Promise<TipoEspacio[]> {
    const response = await apiClient.get<TipoEspacio[]>('/tipos-espacio');
    return response.data;
  },
};
