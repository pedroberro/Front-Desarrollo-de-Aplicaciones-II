import type { ReactNode } from 'react';
import type { TipoEspacio } from '../../types/reservas';
import { TIPOS_ESPACIO } from '../../utils/catalogo';
import { horasCada30, hhmm, minutos } from '../../utils/fechas';
import { FechaInput } from '../ui/FechaInput';
import { Icon } from '../ui/Icon';

export interface FiltroUI {
  fecha: string;
  desde: string;
  hasta: string;
  tipo?: TipoEspacio;
  capacidadMinima?: number;
  ventana?: boolean;
}

const CAPACIDADES = [2, 4, 6, 8, 12, 16, 20, 24, 30];

interface FiltrosFranjaProps {
  filtro: FiltroUI;
  apertura: string;
  cierre: string;
  onChange: (cambio: Partial<FiltroUI>) => void;
  onLimpiar: () => void;
  /** Counter or admin badges shown at the right. */
  resumen?: ReactNode;
  /** Admin variant: building and floor selectors instead of type and capacity. */
  antes?: ReactNode;
  soloFranja?: boolean;
  acciones?: ReactNode;
}

export function FiltrosFranja({ filtro, apertura, cierre, onChange, onLimpiar, resumen, antes, soloFranja, acciones }: FiltrosFranjaProps) {
  const horas = horasCada30(apertura, cierre);

  // Moving "desde" keeps the length of the slot when it still fits, so the user does not have to fix "hasta".
  const cambiarDesde = (desde: string) => {
    const largo = Math.max(30, minutos(filtro.hasta) - minutos(filtro.desde));
    const hasta = Math.min(minutos(desde) + largo, minutos(cierre));
    onChange({ desde, hasta: hhmm(hasta > minutos(desde) ? hasta : minutos(desde) + 30) });
  };

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      {antes}
      <FechaInput id="filtro-fecha" label={antes ? 'Día' : 'Fecha'} valor={filtro.fecha} onChange={(fecha) => onChange({ fecha })} className="w-full sm:w-[184px]" />
      <div className="field w-[calc(50%-6px)] sm:w-[116px]">
        <label className="label" htmlFor="filtro-desde">Desde</label>
        <div className="input">
          <Icon name="clock" className="input-icon" />
          <select id="filtro-desde" value={filtro.desde} onChange={(e) => cambiarDesde(e.target.value)}>
            {horas.slice(0, -1).map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>
      <div className="field w-[calc(50%-6px)] sm:w-[116px]">
        <label className="label" htmlFor="filtro-hasta">Hasta</label>
        <div className="input">
          <select id="filtro-hasta" value={filtro.hasta} onChange={(e) => onChange({ hasta: e.target.value })}>
            {horas.filter((h) => minutos(h) > minutos(filtro.desde)).map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      </div>

      {!soloFranja && (
        <>
          <div className="hidden h-9 w-px bg-slate-200 lg:block" aria-hidden="true" />
          <div className="field w-full sm:w-[196px]">
            <label className="label" htmlFor="filtro-tipo">Tipo de espacio</label>
            <div className="input">
              <select id="filtro-tipo" value={filtro.tipo ?? ''} onChange={(e) => onChange({ tipo: (e.target.value || undefined) as TipoEspacio | undefined })}>
                <option value="">Todos los tipos</option>
                {TIPOS_ESPACIO.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="field w-[calc(60%-6px)] sm:w-[168px]">
            <label className="label" htmlFor="filtro-cap">Capacidad mínima</label>
            <div className="input">
              <select
                id="filtro-cap"
                value={filtro.capacidadMinima ?? ''}
                onChange={(e) => onChange({ capacidadMinima: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Cualquiera</option>
                {CAPACIDADES.map((c) => <option key={c} value={c}>{c} personas</option>)}
              </select>
            </div>
          </div>
          <button
            type="button"
            className={`toggle ${filtro.ventana ? 'toggle-on' : ''}`}
            aria-pressed={!!filtro.ventana}
            onClick={() => onChange({ ventana: !filtro.ventana })}
          >
            <span className="toggle-box">{filtro.ventana && <Icon name="check" size={12} />}</span>
            Con ventana
          </button>
        </>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-3 self-center pt-5">
        {resumen}
        {!soloFranja && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onLimpiar}>
            <Icon name="x" size={14} />
            Limpiar
          </button>
        )}
        {acciones}
      </div>
    </div>
  );
}
