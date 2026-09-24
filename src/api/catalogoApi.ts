import apiClient from './axiosClient';
import type {
  AgendaEspacio,
  EdificioConPisos,
  EdificioDetalle,
  EmpresaDetalle,
  EmpresaResumen,
  EspacioBreve,
  EspacioDetalle,
  FiltroPlano,
  Franja,
  PlanoPiso,
} from '../types/reservas';

/** Drops empty values so the URL only carries the filters that are set. */
export function params(values: object): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false)
      .map(([k, v]) => [k, String(v)]),
  );
}

export const catalogoApi = {
  async empresas(): Promise<EmpresaResumen[]> {
    return (await apiClient.get<EmpresaResumen[]>('/empresas')).data;
  },

  async empresa(id: number): Promise<EmpresaDetalle> {
    return (await apiClient.get<EmpresaDetalle>(`/empresas/${id}`)).data;
  },

  async edificio(id: number): Promise<EdificioDetalle> {
    return (await apiClient.get<EdificioDetalle>(`/edificios/${id}`)).data;
  },

  async edificiosConPisos(): Promise<EdificioConPisos[]> {
    return (await apiClient.get<EdificioConPisos[]>('/edificios')).data;
  },

  async plano(pisoId: number, filtro: FiltroPlano): Promise<PlanoPiso> {
    return (await apiClient.get<PlanoPiso>(`/pisos/${pisoId}/plano`, { params: params(filtro) })).data;
  },

  async espaciosDePiso(pisoId: number): Promise<EspacioBreve[]> {
    return (await apiClient.get<EspacioBreve[]>(`/pisos/${pisoId}/espacios`)).data;
  },

  async espacio(id: number): Promise<EspacioDetalle> {
    return (await apiClient.get<EspacioDetalle>(`/espacios/${id}`)).data;
  },

  async agenda(espacioId: number, desde: string, hasta: string): Promise<AgendaEspacio> {
    return (await apiClient.get<AgendaEspacio>(`/espacios/${espacioId}/agenda`, { params: { desde, hasta } })).data;
  },

  async franjasLibres(espacioId: number, fecha: string, duracion: number, cerca?: string): Promise<Franja[]> {
    return (await apiClient.get<Franja[]>(`/espacios/${espacioId}/franjas-libres`, {
      params: params({ fecha, duracion, cerca }),
    })).data;
  },
};
