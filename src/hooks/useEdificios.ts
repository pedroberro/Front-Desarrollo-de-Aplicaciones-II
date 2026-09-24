import { catalogoApi } from '../api/catalogoApi';
import type { EdificioConPisos } from '../types/reservas';
import { useCarga } from './useCarga';

// Buildings and floors barely change during a session and every admin screen needs them for its
// selectors: one request, shared.
let cache: Promise<EdificioConPisos[]> | null = null;

export function useEdificios() {
  return useCarga(() => {
    cache ??= catalogoApi.edificiosConPisos().catch((err) => {
      cache = null;
      throw err;
    });
    return cache;
  }, [], 'No pudimos cargar los edificios.');
}

const CLAVE = 'planta-libre.admin.piso';

/** The floor the administrator used last, so every admin screen opens where they were. */
export function pisoRecordado(edificios: EdificioConPisos[]): { edificioId: number; pisoId: number } | null {
  try {
    const guardado = Number(localStorage.getItem(CLAVE));
    const edificio = edificios.find((e) => e.pisos.some((p) => p.id === guardado));
    if (edificio) return { edificioId: edificio.id, pisoId: guardado };
  } catch {
    // Storage may be unavailable (private mode): fall back to the first floor.
  }
  const primero = edificios.find((e) => e.pisos.length > 0);
  return primero ? { edificioId: primero.id, pisoId: primero.pisos[0].id } : null;
}

export function recordarPiso(pisoId: number) {
  try {
    localStorage.setItem(CLAVE, String(pisoId));
  } catch {
    // Not critical.
  }
}
