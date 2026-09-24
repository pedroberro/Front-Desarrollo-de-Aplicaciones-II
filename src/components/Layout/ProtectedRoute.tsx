import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { HOME_PATH, inicioDe } from '../../routes';

/**
 * Requires a session and, optionally, a permission the backend sent with the user. The server checks
 * it again on every call; this only keeps people out of screens they could not use.
 */
export function ProtectedRoute({ children, permiso }: { children: ReactNode; permiso?: string }) {
  const { isAuthenticated, usuario } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (permiso && !usuario?.permisos?.includes(permiso)) return <Navigate to={HOME_PATH} replace />;
  return <>{children}</>;
}

/** Login and sign-up make no sense with an open session. */
export function GuestRoute({ children, redirectTo }: { children: ReactNode; redirectTo: string }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to={redirectTo} replace /> : <>{children}</>;
}

/** Sends each role to its own home. */
export function Inicio() {
  const { usuario } = useAuth();
  return <Navigate to={inicioDe(usuario)} replace />;
}
