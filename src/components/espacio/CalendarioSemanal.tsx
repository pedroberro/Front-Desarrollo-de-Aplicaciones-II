import { useRef, useState, type PointerEvent } from 'react';
import type { Franja, OcupacionCalendario } from '../../types/reservas';
import { fechaDe, fechaHora, hhmm, horaDe, minutos, minutosDelDia, partesFecha } from '../../utils/fechas';

const PASO = 30;

interface CalendarioSemanalProps {
  dias: string[];
  apertura: string;
  cierre: string;
  ocupaciones: OcupacionCalendario[];
  /** Local "now" of the building, from the API. */
  ahora: string;
  seleccion: Franja | null;
  onSeleccion: (franja: Franja | null) => void;
  /**
   * "seleccionar": drag over free cells to pick a slot (customer).
   * "editar": the selection is an existing booking that can be moved or resized (administrator).
   */
  modo: 'seleccionar' | 'editar';
  /** Slot the booking had before editing, drawn dashed as a reference. */
  original?: Franja | null;
  /** The booking being edited: its own occupation is not an obstacle. */
  reservaEditada?: number | null;
  onElegirOcupacion?: (ocupacion: OcupacionCalendario) => void;
  /** Pixels per half hour. */
  alto?: number;
}

type Arrastre =
  | { tipo: 'nueva'; dia: number; ancla: number; actual: number }
  | { tipo: 'mover'; dia: number; desplazamiento: number; inicio: number; largo: number }
  | { tipo: 'arriba' | 'abajo'; dia: number; inicio: number; fin: number };

/** True when anything but the edited booking takes part of the slot. */
export function haySuperposicion(ocupaciones: OcupacionCalendario[], franja: Franja, ignorar?: number | null): boolean {
  return ocupaciones.some(
    (o) => (ignorar == null || o.reservaId !== ignorar) && o.inicio < franja.fin && franja.inicio < o.fin,
  );
}

export function CalendarioSemanal({
  dias,
  apertura,
  cierre,
  ocupaciones,
  ahora,
  seleccion,
  onSeleccion,
  modo,
  original,
  reservaEditada,
  onElegirOcupacion,
  alto = 20,
}: CalendarioSemanalProps) {
  const columnasRef = useRef<HTMLDivElement>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);

  const inicioDia = minutos(apertura);
  const slots = Math.max(1, (minutos(cierre) - inicioDia) / PASO);
  const minutoDe = (slot: number) => inicioDia + slot * PASO;
  const franjaDe = (dia: number, desde: number, hasta: number): Franja => ({
    inicio: fechaHora(dias[dia], hhmm(minutoDe(desde))),
    fin: fechaHora(dias[dia], hhmm(minutoDe(hasta))),
  });

  const obstaculos = ocupaciones.filter((o) => reservaEditada == null || o.reservaId !== reservaEditada);
  const slotLibre = (dia: number, slot: number) => {
    const f = franjaDe(dia, slot, slot + 1);
    return f.inicio >= ahora.slice(0, 16) + ':00' && !haySuperposicion(obstaculos, f);
  };

  const posicion = (e: PointerEvent) => {
    const rect = columnasRef.current!.getBoundingClientRect();
    const dia = Math.min(dias.length - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * dias.length)));
    const slot = Math.min(slots - 1, Math.max(0, Math.floor((e.clientY - rect.top) / alto)));
    return { dia, slot };
  };

  // Selection being drawn: from the drag in progress, or the committed one.
  const vista = (() => {
    if (arrastre?.tipo === 'nueva') {
      return { dia: arrastre.dia, desde: Math.min(arrastre.ancla, arrastre.actual), hasta: Math.max(arrastre.ancla, arrastre.actual) + 1 };
    }
    if (arrastre?.tipo === 'mover') return { dia: arrastre.dia, desde: arrastre.inicio, hasta: arrastre.inicio + arrastre.largo };
    if (arrastre) return { dia: arrastre.dia, desde: arrastre.inicio, hasta: arrastre.fin };
    if (!seleccion) return null;
    const dia = dias.indexOf(fechaDe(seleccion.inicio));
    if (dia < 0) return null;
    return { dia, desde: (minutosDelDia(seleccion.inicio) - inicioDia) / PASO, hasta: (minutosDelDia(seleccion.fin) - inicioDia) / PASO };
  })();
  const vistaFranja = vista ? franjaDe(vista.dia, vista.desde, vista.hasta) : null;
  const conflicto = !!vistaFranja && modo === 'editar' && haySuperposicion(obstaculos, vistaFranja);

  const alPresionar = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || modo !== 'seleccionar') return;
    const { dia, slot } = posicion(e);
    if (!slotLibre(dia, slot)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastre({ tipo: 'nueva', dia, ancla: slot, actual: slot });
  };

  const empezarEdicion = (e: PointerEvent<HTMLElement>, tipo: 'mover' | 'arriba' | 'abajo') => {
    if (!vista || e.button !== 0) return;
    e.stopPropagation();
    columnasRef.current!.setPointerCapture(e.pointerId);
    const { slot } = posicion(e);
    setArrastre(
      tipo === 'mover'
        ? { tipo, dia: vista.dia, desplazamiento: slot - vista.desde, inicio: vista.desde, largo: vista.hasta - vista.desde }
        : { tipo, dia: vista.dia, inicio: vista.desde, fin: vista.hasta },
    );
  };

  const alMover = (e: PointerEvent<HTMLDivElement>) => {
    if (!arrastre) return;
    const { dia, slot } = posicion(e);
    if (arrastre.tipo === 'nueva') {
      // Grows from the anchor towards the pointer, stopping at the first taken or past cell.
      const paso = slot >= arrastre.ancla ? 1 : -1;
      let actual = arrastre.ancla;
      while (actual !== slot && slotLibre(arrastre.dia, actual + paso)) actual += paso;
      setArrastre({ ...arrastre, actual });
    } else if (arrastre.tipo === 'mover') {
      const inicio = Math.min(slots - arrastre.largo, Math.max(0, slot - arrastre.desplazamiento));
      setArrastre({ ...arrastre, dia, inicio });
    } else if (arrastre.tipo === 'arriba') {
      setArrastre({ ...arrastre, inicio: Math.min(arrastre.fin - 1, Math.max(0, slot)) });
    } else {
      setArrastre({ ...arrastre, fin: Math.max(arrastre.inicio + 1, Math.min(slots, slot + 1)) });
    }
  };

  const alSoltar = () => {
    if (!arrastre || !vista) return setArrastre(null);
    onSeleccion(franjaDe(vista.dia, vista.desde, vista.hasta));
    setArrastre(null);
  };

  const hoy = fechaDe(ahora);
  const cuerpo = slots * alto;

  return (
    <div className="flex flex-col">
      <div className="cal" style={{ gridTemplateColumns: `44px repeat(${dias.length}, minmax(0, 1fr))` }}>
        <span />
        {dias.map((dia) => {
          const p = partesFecha(dia);
          return (
            <div key={dia} className={`cal-head ${dia === hoy ? 'cal-head-hoy' : ''}`}>
              {p.semana}
              <b className="num">{p.dia}</b>
            </div>
          );
        })}
      </div>

      <div className="flex border-t border-slate-200">
        <div className="relative w-[44px] flex-none" style={{ height: cuerpo }}>
          {Array.from({ length: slots / 2 }, (_, i) => (
            <span key={i} className="cal-hora absolute right-0" style={{ top: i * 2 * alto }}>
              {hhmm(inicioDia + i * 60)}
            </span>
          ))}
        </div>
        <div
          ref={columnasRef}
          className="grid grow"
          style={{ gridTemplateColumns: `repeat(${dias.length}, minmax(0, 1fr))`, height: cuerpo, touchAction: arrastre ? 'none' : 'pan-y' }}
          onPointerDown={alPresionar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={() => setArrastre(null)}
          role="grid"
          aria-label="Calendario semanal del espacio"
        >
          {dias.map((dia, d) => {
            const pasado = dia < hoy ? cuerpo : dia === hoy ? Math.min(cuerpo, Math.max(0, ((minutos(horaDe(ahora)) - inicioDia) / PASO) * alto)) : 0;
            const delDia = ocupaciones.filter((o) => fechaDe(o.inicio) <= dia && fechaDe(o.fin) >= dia);
            return (
              <div key={dia} className="cal-col" role="row">
                {Array.from({ length: slots }, (_, s) => (
                  <div
                    key={s}
                    className={`cal-slot ${s % 2 === 0 ? 'cal-slot-hora' : ''} ${modo === 'seleccionar' && slotLibre(d, s) ? 'cal-slot-libre' : ''}`}
                    style={{ height: alto }}
                  />
                ))}
                {pasado > 0 && <div className="cal-pasado" style={{ height: pasado }} />}

                {delDia
                  .filter((o) => !(modo === 'editar' && reservaEditada != null && o.reservaId === reservaEditada))
                  .map((o, i) => {
                    const desde = Math.max(0, (minutosDiaEn(o.inicio, dia, 0) - inicioDia) / PASO);
                    const hasta = Math.min(slots, (minutosDiaEn(o.fin, dia, 1440) - inicioDia) / PASO);
                    if (hasta <= desde) return null;
                    const clase = o.tipo === 'BLOQUEO' ? 'cal-oc-blq' : o.propia ? 'cal-oc-propia' : '';
                    const texto = o.tipo === 'BLOQUEO' ? (o.motivo ?? 'Bloqueado') : o.propia ? `Tu reserva · ${o.codigo}` : o.cliente ? `${o.cliente}` : 'Ocupado';
                    const elegible = !!onElegirOcupacion && o.tipo === 'RESERVA' && o.reservaId != null;
                    return (
                      <div
                        key={`${o.inicio}-${i}`}
                        className={`cal-oc ${clase} ${elegible ? 'cal-oc-admin' : ''}`}
                        style={{ top: desde * alto + 1, height: (hasta - desde) * alto - 2 }}
                        title={`${texto} · ${horaDe(o.inicio)}–${horaDe(o.fin)}`}
                        onPointerDown={(e) => elegible && e.stopPropagation()}
                        onClick={() => elegible && onElegirOcupacion!(o)}
                      >
                        {texto}
                      </div>
                    );
                  })}

                {modo === 'editar' && original && fechaDe(original.inicio) === dia && (
                  <div
                    className="cal-sel-original"
                    style={{
                      top: ((minutosDelDia(original.inicio) - inicioDia) / PASO) * alto,
                      height: ((minutosDelDia(original.fin) - minutosDelDia(original.inicio)) / PASO) * alto,
                    }}
                  >
                    {horaDe(original.inicio)} –
                  </div>
                )}

                {vista && vista.dia === d && vistaFranja && (
                  <div
                    className={`cal-sel ${modo === 'editar' ? 'cal-move' : ''} ${conflicto ? 'cal-conflicto' : ''}`}
                    style={{ top: vista.desde * alto + 1, height: (vista.hasta - vista.desde) * alto - 2 }}
                    onPointerDown={(e) => modo === 'editar' && empezarEdicion(e, 'mover')}
                  >
                    {horaDe(vistaFranja.inicio)} – {vista.hasta - vista.desde >= 2 ? horaDe(vistaFranja.fin) : ''}
                    {modo === 'editar' && (
                      <>
                        <span className="cal-handle cal-handle-top" onPointerDown={(e) => empezarEdicion(e, 'arriba')} aria-hidden="true" />
                        <span className="cal-handle cal-handle-bottom" onPointerDown={(e) => empezarEdicion(e, 'abajo')} aria-hidden="true" />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Minutes of the day of a timestamp, or the given edge when it falls on another day (multi-day blocks). */
function minutosDiaEn(fechaHoraValor: string, dia: string, siOtroDia: number): number {
  return fechaDe(fechaHoraValor) === dia ? minutosDelDia(fechaHoraValor) : siOtroDia;
}
