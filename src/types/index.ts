export interface Usuario {
  id: string;
  fullName: string;
  email: string;
  telefono: string;
  role: 'cliente' | 'proveedor' | 'admin';
  status: string;
  createdAt: string;
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
  telefono: string;
  password: string;
  rol: string;
  medioPago?: MedioPagoRequest;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface UpdateMeRequest {
  telefono: string;
}

export interface ChangePasswordRequest {
  passwordActual: string;
  passwordNueva: string;
}

export interface MedioPagoRequest {
  titular: string;
  numeroTarjeta: string;
  vencimiento: string;
  codigoSeguridad: string;
}

export interface MedioPagoResumen {
  id: number;
  tipo: string;
  descripcion: string;
  verificado: boolean;
  estado: string;
}

export interface EspaciosFilters {
  sede?: string;
  tipo?: string;
  capacidad?: number;
  fecha?: string;
  page?: number;
  size?: number;
}
