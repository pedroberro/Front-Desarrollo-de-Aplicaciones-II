import type { Usuario } from './types';

// Where a signed-in user lands: /inicio forwards to the home of their role.
export const HOME_PATH = '/inicio';

export function inicioDe(usuario: Usuario | null): string {
  if (!usuario) return '/login';
  return usuario.permisos?.includes('RESERVAS_GESTIONAR') ? '/admin/agenda' : '/empresas';
}

/** Router state other screens pass to /login to show a one-off notice. */
export interface LoginAviso {
  aviso: string;
}
