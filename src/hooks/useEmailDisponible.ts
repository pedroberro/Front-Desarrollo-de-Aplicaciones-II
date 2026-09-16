import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { authApi } from '../api/authApi';

export type EstadoEmail = 'sin-verificar' | 'verificando' | 'disponible' | 'ocupado' | 'error';

const normalizar = (email: string) => email.trim().toLowerCase();

/**
 * Checks on demand whether an email already has an account. The result belongs to the
 * email it was checked for, so editing the field drops back to 'sin-verificar'.
 * A failed check ('error', e.g. rate limited) never blocks: sign-up checks again.
 */
export function useEmailDisponible(email: string) {
  const [resultado, setResultado] = useState<{ email: string; estado: EstadoEmail } | null>(null);
  const pendiente = useRef<AbortController | null>(null);

  useEffect(() => () => pendiente.current?.abort(), []);

  const verificar = useCallback((valor: string) => {
    const clave = normalizar(valor);
    pendiente.current?.abort();
    const controller = new AbortController();
    pendiente.current = controller;
    setResultado({ email: clave, estado: 'verificando' });

    authApi
      .emailDisponible(clave, controller.signal)
      .then((disponible) => setResultado({ email: clave, estado: disponible ? 'disponible' : 'ocupado' }))
      .catch((err) => {
        if (!axios.isCancel(err)) setResultado({ email: clave, estado: 'error' });
      });
  }, []);

  const estado: EstadoEmail = resultado?.email === normalizar(email) ? resultado.estado : 'sin-verificar';
  return { estado, verificar };
}
