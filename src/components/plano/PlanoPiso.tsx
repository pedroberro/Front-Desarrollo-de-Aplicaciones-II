import type { CSSProperties } from 'react';
import type { EspacioEnPlano, PlanoPiso as Plano, ServicioEnPlano } from '../../types/reservas';
import { ICONO_SERVICIO } from '../../utils/catalogo';
import { cuandoLibre, fechaDe, horaDe, rangoHorario } from '../../utils/fechas';
import { EstadoEspacioBadge } from '../ui/EstadoBadge';
import { Icon } from '../ui/Icon';

interface PlanoPisoProps {
  plano: Plano;
  seleccionadoId?: number | null;
  onSeleccionar: (espacio: EspacioEnPlano) => void;
  /** The customer only opens free spaces; the administrator opens any of them. */
  modo: 'cliente' | 'admin';
}

const ESTADO_CLASE = { LIBRE: 'tile-libre', OCUPADO: 'tile-ocupado', BLOQUEADO: 'tile-bloqueado' } as const;
const ESTADO_TEXTO = { LIBRE: 'Libre', OCUPADO: 'Ocupado', BLOQUEADO: 'Bloqueado' } as const;

function area({ x, y, ancho, alto }: { x: number; y: number; ancho: number; alto: number }): CSSProperties {
  return { gridColumn: `${x + 1} / span ${ancho}`, gridRow: `${y + 1} / span ${alto}` };
}

/**
 * The floor drawn on a grid: walls, windows, corridor, bookable spaces with their state for the
 * chosen slot, and the floor services, which are shown but never booked.
 */
export function PlanoPiso({ plano, seleccionadoId, onSeleccionar, modo }: PlanoPisoProps) {
  const { piso, espacios, servicios } = plano;
  const filas = Math.max(0, ...espacios.map((e) => e.posicion.y + e.posicion.alto), ...servicios.map((s) => s.posicion.y + s.posicion.alto));
  const plantillaFilas = Array.from({ length: filas }, (_, i) => (i === piso.filaPasillo ? '58px' : 'auto')).join(' ');

  // Window marks follow the spaces that actually have a window on each wall.
  const norte = espacios.filter((e) => e.ventana && e.posicion.y === 0);
  const inicioNorte = Math.min(...norte.map((e) => e.posicion.x));
  const finNorte = Math.max(...norte.map((e) => e.posicion.x + e.posicion.ancho));
  const ancho = (desde: number, hasta: number) => `calc((100% - 44px) * ${(hasta - desde) / piso.columnas})`;

  return (
    <div className="plano-wrap">
      <div className="plano" role="group" aria-label={`Plano del ${piso.nombre.toLowerCase()}`}>
        {piso.ventanas.includes('NORTE') && norte.length > 0 && (
          <span className="win-n" style={{ left: `calc(22px + (100% - 44px) * ${inicioNorte / piso.columnas})`, width: ancho(inicioNorte, finNorte) }} aria-hidden="true" />
        )}
        {piso.ventanas.includes('OESTE') && <span className="win-w" style={{ top: '6%', height: '62%' }} aria-hidden="true" />}
        {piso.ventanas.includes('ESTE') && <span className="win-e" style={{ top: '6%', height: '62%' }} aria-hidden="true" />}

        <div className="plano-grid" style={{ gridTemplateColumns: `repeat(${piso.columnas}, minmax(0, 1fr))`, gridTemplateRows: plantillaFilas }}>
          {piso.filaPasillo !== null && (
            <div className="pasillo" style={{ gridRow: piso.filaPasillo + 1 }} aria-hidden="true">
              PASILLO
            </div>
          )}
          {espacios.map((e) => (
            <Espacio
              key={e.id}
              espacio={e}
              seleccionado={e.id === seleccionadoId}
              abrible={modo === 'admin' || (e.estado === 'LIBRE' && e.cumpleFiltros)}
              arriba={piso.filaPasillo !== null && e.posicion.y > piso.filaPasillo}
              referencia={plano.franja.inicio}
              modo={modo}
              onClick={() => onSeleccionar(e)}
            />
          ))}
          {servicios.map((s) => <Servicio key={s.id} servicio={s} />)}
        </div>
      </div>
    </div>
  );
}

interface EspacioProps {
  espacio: EspacioEnPlano;
  seleccionado: boolean;
  abrible: boolean;
  arriba: boolean;
  referencia: string;
  modo: 'cliente' | 'admin';
  onClick: () => void;
}

function Espacio({ espacio: e, seleccionado, abrible, arriba, referencia, modo, onClick }: EspacioProps) {
  const sala = e.tipo !== 'CUBICULO';
  const clase = seleccionado ? 'tile-sel' : ESTADO_CLASE[e.estado];
  const texto = seleccionado
    ? 'Seleccionado'
    : e.estado !== 'LIBRE' && sala && e.ocupacion
      ? `${ESTADO_TEXTO[e.estado]} · ${horaDe(e.ocupacion.inicio)}–${horaDe(e.ocupacion.fin)}`
      : ESTADO_TEXTO[e.estado];

  return (
    <div className="tile-cell" style={area(e.posicion)}>
      <button
        type="button"
        className={`tile h-full w-full ${sala ? 'tile-sala' : ''} ${clase} ${e.cumpleFiltros ? '' : 'tile-dim'}`}
        disabled={!abrible}
        onClick={onClick}
        aria-pressed={seleccionado}
        aria-label={`${e.codigo}, ${e.tipoEtiqueta}, ${e.capacidad} ${e.capacidad === 1 ? 'persona' : 'personas'}, ${texto}`}
      >
        {e.ventana && <Icon name="window" size={14} className="tile-winic" />}
        {seleccionado ? <Icon name="check" size={16} className="absolute top-1.5 right-1.5 text-[color:var(--on-accent)]" /> : <i className="tile-glyph" aria-hidden="true" />}
        <span className="tile-code">{e.codigo}</span>
        {sala && <span className="tile-sub">{e.tipoEtiqueta} · {e.capacidad} personas</span>}
        <span className="tile-lbl">{texto}</span>
      </button>

      {e.cumpleFiltros && (
        <div className={`tip ${arriba ? 'tip-arriba' : 'tip-abajo'}`} role="tooltip">
          <div className="flex items-center justify-between gap-2">
            <b className="mono t-sm">{e.codigo}</b>
            <EstadoEspacioBadge estado={e.estado} />
          </div>
          <p className="t-xs mt-0.5 text-slate-400">
            {e.tipoEtiqueta} · {sala ? `hasta ${e.capacidad} personas` : '1 persona'}
          </p>
          <div className="my-2 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
            {e.equipamiento.slice(0, 2).map((item) => <span key={item} className="tip-chip">{item}</span>)}
            <span className="tip-chip">
              <Icon name="window" size={12} />
              {e.ventana ? 'Con ventana' : 'Sin ventana'}
            </span>
          </div>
          <p className="t-xs">
            Próximo horario libre:{' '}
            <b className="num">
              {e.proximoLibre
                ? `${fechaDe(e.proximoLibre.inicio) === fechaDe(referencia) ? '' : `${cuandoLibre(e.proximoLibre.inicio, referencia).replace(/ \d\d:\d\d$/, '')} · `}${rangoHorario(e.proximoLibre.inicio, e.proximoLibre.fin)}`
                : 'nada en dos semanas'}
            </b>
          </p>
          <p className="t-xs mt-1.5 text-slate-400">
            {modo === 'admin' ? 'Clic para ver sus reservas y editarlas' : abrible ? 'Clic para abrir el calendario' : 'Solo se abren los espacios libres en la franja'}
          </p>
        </div>
      )}
    </div>
  );
}

function Servicio({ servicio: s }: { servicio: ServicioEnPlano }) {
  return (
    <div className="tile tile-sala tile-servicio" style={area(s.posicion)} aria-label={`${s.nombre}, servicio del piso, no se reserva`}>
      <Icon name={ICONO_SERVICIO[s.tipo] ?? 'info'} size={20} />
      <span className="tile-code">{s.nombre}</span>
      <span className="tile-sub">servicio del piso · no reservable</span>
    </div>
  );
}

export function Referencias() {
  const items = [
    { clase: 'tile-libre', titulo: 'Libre', texto: 'Se puede reservar en esta franja' },
    { clase: 'tile-ocupado', titulo: 'Ocupado', texto: 'Ya reservado por otra persona' },
    { clase: 'tile-bloqueado', titulo: 'Bloqueado', texto: 'Mantenimiento, limpieza o evento' },
    { clase: 'tile-sel', titulo: 'Seleccionado', texto: 'Lo que estás por reservar' },
    { clase: 'tile-servicio', titulo: 'Servicio del piso', texto: 'Baño, cocina, sala de estar. No se reserva' },
  ];
  return (
    <div className="card">
      <div className="card-hd">
        <h2 className="t-sm font-semibold">Referencias</h2>
        <span className="t-xs muted2">siempre visible</span>
      </div>
      <ul className="card-bd flex flex-col gap-3.5">
        {items.map((i) => (
          <li key={i.titulo} className="flex items-start gap-3">
            <span className={`swatch tile ${i.clase}`} aria-hidden="true">
              {i.clase === 'tile-sel' ? <Icon name="check" size={12} className="absolute top-0.5 right-0.5 text-[color:var(--on-accent)]" /> : <i className="tile-glyph" />}
            </span>
            <span className="flex flex-col">
              <b className="t-sm font-semibold">{i.titulo}</b>
              <span className="t-xs muted">{i.texto}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="t-xs muted mx-4 mb-4 flex gap-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
        <Icon name="info" size={14} className="mt-0.5" />
        Cada estado se distingue por color, trama y símbolo, para que se lea sin depender del color.
      </p>
    </div>
  );
}
