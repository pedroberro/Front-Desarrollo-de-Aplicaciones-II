export type Rol = 'CLIENTE' | 'PROVEEDOR' | 'ADMIN';

export interface Usuario {
  id: number;
  publicId: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: Rol;
  estado: string;
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

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string>;
  /** Identifies cases the UI handles specially, e.g. EMAIL_NO_CONFIRMADO. */
  code?: string;
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
  nuevaPassword: string;
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

export interface MedioPagoUpdateRequest {
  titular: string;
  vencimiento: string;
}

export interface MedioPagoResumen {
  id: number;
  tipo: string;
  descripcion: string;
  ultimos4: string;
  titular: string;
  vencimiento: string;
  principal: boolean;
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
