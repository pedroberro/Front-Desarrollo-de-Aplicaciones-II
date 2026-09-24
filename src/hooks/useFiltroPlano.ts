import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FiltroUI } from '../components/plano/FiltrosFranja';
import type { FiltroPlano, TipoEspacio } from '../types/reservas';

export type Vista = 'plano' | 'lista';

const CLAVES_FILTRO = ['fecha', 'desde', 'hasta', 'tipo', 'cap', 'ventana'];

/**
 * The plan's filters, view and open space live in the URL: a slot can be shared or reloaded as is,
 * and the browser's back button undoes a filter change.
 */
export function useFiltroPlano() {
  const [sp, setSp] = useSearchParams();

  const filtro: FiltroPlano = useMemo(
    () => ({
      fecha: sp.get('fecha') ?? undefined,
      desde: sp.get('desde') ?? undefined,
      hasta: sp.get('hasta') ?? undefined,
      tipo: (sp.get('tipo') as TipoEspacio | null) ?? undefined,
      capacidadMinima: sp.get('cap') ? Number(sp.get('cap')) : undefined,
      ventana: sp.get('ventana') === '1' || undefined,
    }),
    [sp],
  );

  // Only what changes the data: switching view or opening a space must not reload the plan.
  const clave = CLAVES_FILTRO.map((k) => `${k}=${sp.get(k) ?? ''}`).join('&');

  const vista: Vista = (sp.get('vista') as Vista | null) ?? (typeof window !== 'undefined' && window.innerWidth < 900 ? 'lista' : 'plano');
  const espacioId = sp.get('espacio') ? Number(sp.get('espacio')) : null;

  const actualizar = useCallback(
    (cambios: Record<string, string | undefined>, reemplazar = false) => {
      setSp(
        (actual) => {
          const nuevo = new URLSearchParams(actual);
          for (const [k, v] of Object.entries(cambios)) {
            if (v === undefined || v === '') nuevo.delete(k);
            else nuevo.set(k, v);
          }
          return nuevo;
        },
        { replace: reemplazar },
      );
    },
    [setSp],
  );

  const cambiarFiltro = useCallback(
    (cambio: Partial<FiltroUI>) => {
      const valores: Record<string, string | undefined> = {};
      if ('fecha' in cambio) valores.fecha = cambio.fecha;
      if ('desde' in cambio) valores.desde = cambio.desde;
      if ('hasta' in cambio) valores.hasta = cambio.hasta;
      if ('tipo' in cambio) valores.tipo = cambio.tipo;
      if ('capacidadMinima' in cambio) valores.cap = cambio.capacidadMinima?.toString();
      if ('ventana' in cambio) valores.ventana = cambio.ventana ? '1' : undefined;
      actualizar(valores);
    },
    [actualizar],
  );

  const limpiar = useCallback(
    () => actualizar(Object.fromEntries(CLAVES_FILTRO.map((k) => [k, undefined]))),
    [actualizar],
  );

  return {
    filtro,
    clave,
    vista,
    espacioId,
    cambiarFiltro,
    limpiar,
    setVista: (v: Vista) => actualizar({ vista: v }),
    setEspacio: (id: number | null) => actualizar({ espacio: id?.toString() }),
    /** Writes the slot the server chose, so the URL always shows what is on screen. */
    fijarFranja: (fecha: string, desde: string, hasta: string) => actualizar({ fecha, desde, hasta }, true),
    query: sp,
  };
}
