export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'CLIENTE' | 'PROVEEDOR';
}

export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
}

export interface TipoEspacio {
  id: number;
  nombre: string;
}

export interface Espacio {
  id: number;
  nombre: string;
  tipo: TipoEspacio;
  sede: Sede;
  capacidad: number;
  descripcion: string;
  precioPorHora: number;
  disponible: boolean;
  imagenUrl?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export interface EspaciosFilters {
  sede?: string;
  tipo?: string;
  capacidad?: number;
  fecha?: string;
  page?: number;
  size?: number;
}
