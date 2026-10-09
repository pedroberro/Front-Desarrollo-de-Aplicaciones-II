import type { Franja, OcupacionCalendario } from '../../types/reservas';
import { horaDe, minutos, minutosDelDia } from '../../utils/fechas';

interface BarraOcupacionProps {
  apertura: string;
  cierre: string;
  fecha: string;
  ocupaciones: OcupacionCalendario[];
  /** The slot being created or edited. */
  esta?: Franja | null;
  conflicto?: boolean;
  etiqueta?: string;
}

/** One day of one space as a bar: what is taken, and where the slot being edited falls. */
export function BarraOcupacion({ apertura, cierre, fecha, ocupaciones, esta, conflicto, etiqueta = 'Esta' }: BarraOcupacionProps) {
  const inicio = minutos(apertura);
  const total = minutos(cierre) - inicio;
  const pct = (valor: string, borde: number) => {
    const m = valor.slice(0, 10) === fecha ? minutosDelDia(valor) : borde;
    return Math.min(100, Math.max(0, ((m - inicio) / total) * 100));
  };
  const medio = inicio + Math.round(total / 60 / 2) * 60;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="barra" role="img" aria-label={`Ocupación del día entre ${apertura} y ${cierre}`}>
        {ocupaciones.map((o, i) => {
          const a = pct(o.inicio, 0);
          const b = pct(o.fin, 1440);
          return (
            <span
              key={i}
              className={`barra-oc ${o.tipo === 'BLOQUEO' ? 'barra-blq' : ''}`}
              style={{ left: `${a}%`, width: `${b - a}%` }}
              title={`${o.tipo === 'BLOQUEO' ? 'Bloqueo' : o.cliente ?? 'Reserva'} · ${horaDe(o.inicio)}–${horaDe(o.fin)}`}
            />
          );
        })}
        {esta && (
          <span
            className={`barra-esta ${conflicto ? 'barra-esta-mal' : ''}`}
            style={{ left: `${pct(esta.inicio, 0)}%`, width: `${pct(esta.fin, 1440) - pct(esta.inicio, 0)}%` }}
          >
            {etiqueta}
          </span>
        )}
      </div>
      <div className="mono flex justify-between text-[11px] text-slate-500">
        <span>{apertura}</span>
        <span>{String(Math.floor(medio / 60)).padStart(2, '0')}:00</span>
        <span>{cierre}</span>
      </div>
    </div>
  );
}
