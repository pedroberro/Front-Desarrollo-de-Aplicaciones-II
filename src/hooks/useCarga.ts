import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { getApiErrorMessage } from '../api/apiError';

export type Carga<T> =
  | { tipo: 'cargando'; datos?: T }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; datos: T };

/**
 * Loads data for a screen and exposes the three states every screen draws (skeleton, error, content).
 * Results of a stale request are dropped, so fast filter changes never paint old data.
 * While reloading, the previous data stays available to avoid flashing the skeleton.
 */
export function useCarga<T>(cargar: () => Promise<T>, deps: DependencyList, mensajeError = 'No pudimos cargar los datos.') {
  const [estado, setEstado] = useState<Carga<T>>({ tipo: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado((actual) => ({ tipo: 'cargando', datos: actual.tipo === 'listo' ? actual.datos : undefined }));
    cargar()
      .then((datos) => vigente && setEstado({ tipo: 'listo', datos }))
      .catch((err) => vigente && setEstado({ tipo: 'error', mensaje: getApiErrorMessage(err, mensajeError) }));
    return () => {
      vigente = false;
    };
    // The caller's deps decide when to reload; `cargar` is a new closure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intento]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);
  const datos = estado.tipo === 'listo' ? estado.datos : estado.tipo === 'cargando' ? estado.datos : undefined;
  const setDatos = useCallback((nuevos: T) => setEstado({ tipo: 'listo', datos: nuevos }), []);

  return { estado, datos, recargar, setDatos };
}
