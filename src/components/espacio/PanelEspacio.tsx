import type { ReactNode } from 'react';
import type { AgendaEspacio, EspacioEnPlano, Franja } from '../../types/reservas';
import { iconoEquipamiento } from '../../utils/catalogo';
import { duracion, fechaCorta, fechaDe, hoyISO, lunesDe, minutosEntre, rangoDeDias, rangoHorario, sumarDias } from '../../utils/fechas';
import { EstadoEspacioBadge } from '../ui/EstadoBadge';
import { Icon } from '../ui/Icon';
import { CalendarioSemanal } from './CalendarioSemanal';

export const MAXIMO_MINUTOS = 480;

interface PanelEspacioProps {
  espacio: EspacioEnPlano;
  piso: string;
  edificio: string;
  semana: string;
  onSemana: (lunes: string) => void;
  agenda: AgendaEspacio | undefined;
  seleccion: Franja | null;
  onSeleccion: (franja: Franja | null) => void;
  onReservar: () => void;
  onCerrar: () => void;
}

/** Screen 7, right column: the space's week and the slot the customer is choosing. */
export function PanelEspacio({ espacio, piso, edificio, semana, onSemana, agenda, seleccion, onSeleccion, onReservar, onCerrar }: PanelEspacioProps) {
  const minutosSel = seleccion ? minutosEntre(seleccion.inicio, seleccion.fin) : 0;
  const demasiadoLarga = minutosSel > MAXIMO_MINUTOS;

  return (
    <aside className="card flex flex-col" aria-label={`Calendario de ${espacio.codigo}`}>
      <CabeceraEspacio espacio={espacio} piso={piso} edificio={edificio} onCerrar={onCerrar} />

      <NavegadorSemana semana={semana} onSemana={onSemana} />

      <div className="px-4 pb-2">
        {agenda ? (
          <CalendarioSemanal
            dias={diasHabiles(semana)}
            apertura={agenda.apertura}
            cierre={agenda.cierre}
            ocupaciones={agenda.ocupaciones}
            ahora={agenda.ahora}
            seleccion={seleccion}
            onSeleccion={onSeleccion}
            modo="seleccionar"
          />
        ) : (
          <div className="sk h-[520px]" aria-busy="true" aria-label="Cargando calendario" />
        )}
        <p className="t-xs muted mt-2 flex items-center gap-1.5">
          <Icon name="drag" size={14} />
          Arrastrá sobre celdas contiguas para elegir la franja
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 p-4">
        {seleccion ? (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="t-base font-semibold">
                {fechaCorta(fechaDe(seleccion.inicio), false)} · <span className="num">{rangoHorario(seleccion.inicio, seleccion.fin)}</span>
              </p>
              <p className={`t-xs ${demasiadoLarga ? 'text-rose-600' : 'muted'}`}>
                {demasiadoLarga
                  ? `Una reserva dura como máximo ${MAXIMO_MINUTOS / 60} horas`
                  : `${duracion(minutosSel)} · ${minutosSel / 30} ${minutosSel === 30 ? 'bloque' : 'bloques'} de 30 min`}
              </p>
            </div>
            <span className="badge b-accent badge-sm">
              <Icon name="check" size={12} />
              Selección
            </span>
          </div>
        ) : (
          <p className="t-sm muted">Elegí una franja libre en el calendario.</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-secondary btn-lg" onClick={() => onSeleccion(null)} disabled={!seleccion}>
            Limpiar selección
          </button>
          <button type="button" className="btn btn-primary btn-lg" onClick={onReservar} disabled={!seleccion || demasiadoLarga}>
            Reservar
          </button>
        </div>
      </div>
    </aside>
  );
}

export function CabeceraEspacio({
  espacio,
  piso,
  edificio,
  onCerrar,
  children,
}: {
  espacio: EspacioEnPlano;
  piso: string;
  edificio: string;
  onCerrar: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h2 className="mono t-2xl font-semibold">{espacio.codigo}</h2>
          <EstadoEspacioBadge estado={espacio.estado} />
        </div>
        <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={onCerrar} aria-label="Cerrar el panel del espacio">
          <Icon name="x" />
        </button>
      </div>
      <p className="t-sm muted -mt-2">
        {espacio.tipoEtiqueta} · {espacio.capacidad} {espacio.capacidad === 1 ? 'persona' : 'personas'} · {piso}, {edificio}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {espacio.equipamiento.slice(0, 2).map((item) => (
          <span key={item} className="chip">
            <Icon name={iconoEquipamiento(item)} size={14} />
            {item}
          </span>
        ))}
        <span className="chip">
          <Icon name={espacio.ventana ? 'sun' : 'window'} size={14} />
          {espacio.ventana ? 'Con ventana' : 'Sin ventana'}
        </span>
      </div>
      {children}
    </div>
  );
}

export function NavegadorSemana({ semana, onSemana }: { semana: string; onSemana: (lunes: string) => void }) {
  const actual = lunesDe(hoyISO());
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <div className="flex gap-1">
        <button type="button" className="btn btn-secondary btn-sm btn-icon" onClick={() => onSemana(sumarDias(semana, -7))} disabled={semana <= actual} aria-label="Semana anterior">
          <Icon name="chevLeft" size={14} />
        </button>
        <button type="button" className="btn btn-secondary btn-sm btn-icon" onClick={() => onSemana(sumarDias(semana, 7))} aria-label="Semana siguiente">
          <Icon name="chevRight" size={14} />
        </button>
      </div>
      <b className="t-sm font-semibold">{rangoDeDias(semana, sumarDias(semana, 4))}</b>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onSemana(actual)} disabled={semana === actual}>
        Hoy
      </button>
    </div>
  );
}

export function diasHabiles(lunes: string): string[] {
  return Array.from({ length: 5 }, (_, i) => sumarDias(lunes, i));
}
