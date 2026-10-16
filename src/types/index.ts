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
  permisos: string[];
}

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string>;
  /** Identifies cases the UI handles specially, e.g. EMAIL_NO_CONFIRMADO. */
  code?: string;
}

/** A signed-in session. The refresh token never reaches the page: it is an HttpOnly cookie. */
export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

/** First half of an administrator sign-in: the password was right, the second factor is missing. */
export interface DesafioSegundoFactor {
  segundoFactorRequerido: true;
  desafio: string;
  /** Only the first time: the secret to add to the authenticator app. */
  altaSegundoFactor?: { secreto: string; uri: string };
}

export type RespuestaLogin = AuthResponse | DesafioSegundoFactor;

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
