import { createContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthResponse, DesafioSegundoFactor, Usuario, LoginRequest, RegistroRequest } from '../types';
import { authApi } from '../api/authApi';

export interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Signs in, or returns the second-factor challenge when the account needs one (administrators). */
  login: (data: LoginRequest) => Promise<DesafioSegundoFactor | null>;
  completarSegundoFactor: (desafio: string, codigo: string) => Promise<void>;
  /** Stores a session obtained without the login form (e.g. confirming the email). */
  iniciarSesion: (respuesta: AuthResponse) => void;
  register: (data: RegistroRequest) => Promise<void>;
  logout: () => Promise<void>;
  /** Keeps the session copy in sync after the profile changes. */
  setUsuario: (usuario: Usuario) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function leerUsuarioGuardado(): Usuario | null {
  const token = localStorage.getItem('token');
  const guardado = localStorage.getItem('usuario');
  if (!token || !guardado) return null;
  try {
    const usuario = JSON.parse(guardado) as Usuario;
    // Sessions saved by the previous contract (fullName, role…) are discarded.
    if (typeof usuario.nombre === 'string') return usuario;
  } catch {
    // Corrupt entry: fall through and clear it.
  }
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<Usuario | null>(leerUsuarioGuardado);

  const setUsuario = useCallback((actualizado: Usuario) => {
    localStorage.setItem('usuario', JSON.stringify(actualizado));
    setUsuarioState(actualizado);
  }, []);

  const iniciarSesion = useCallback((respuesta: AuthResponse) => {
    localStorage.setItem('token', respuesta.token);
    setUsuario(respuesta.usuario);
  }, [setUsuario]);

  const login = useCallback(async (data: LoginRequest) => {
    const respuesta = await authApi.login(data);
    if ('segundoFactorRequerido' in respuesta && respuesta.segundoFactorRequerido) return respuesta;
    iniciarSesion(respuesta as AuthResponse);
    return null;
  }, [iniciarSesion]);

  const completarSegundoFactor = useCallback(async (desafio: string, codigo: string) => {
    iniciarSesion(await authApi.segundoFactor(desafio, codigo));
  }, [iniciarSesion]);

  const register = useCallback(async (data: RegistroRequest) => {
    await authApi.register(data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setUsuarioState(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        isLoading: false,
        login,
        completarSegundoFactor,
        iniciarSesion,
        register,
        logout,
        setUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
