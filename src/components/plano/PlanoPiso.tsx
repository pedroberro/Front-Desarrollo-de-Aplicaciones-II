import type { CSSProperties } from 'react';
import type { AreaEnPlano, EspacioEnPlano, PlanoPiso as Plano, ServicioEnPlano, TipoArea } from '../../types/reservas';
import { ICONO_SERVICIO } from '../../utils/catalogo';
import { cuandoLibre, fechaDe, horaDe, rangoHorario } from '../../utils/fechas';
import { EstadoEspacioBadge } from '../ui/EstadoBadge';
import { Icon, type IconName } from '../ui/Icon';
import { abreArriba, bordes, esVertical, plantillaFilas, ventanaDe } from './geometria';

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

/** How each kind of structural area is drawn. A new kind only needs an entry here. */
const AREA: Record<TipoArea, { clase: string; icono?: IconName; texto: (a: AreaEnPlano) => string; hastaElMuro: boolean }> = {
  PASILLO: { clase: 'pasillo', texto: () => 'PASILLO', hastaElMuro: true },
  NUCLEO: { clase: 'area-nucleo', icono: 'layers', texto: (a) => a.etiqueta, hastaElMuro: false },
  APOYO: { clase: 'area-apoyo', texto: (a) => a.etiqueta, hastaElMuro: false },
  EXTERIOR: { clase: 'area-exterior', icono: 'sun', texto: (a) => a.etiqueta.toUpperCase(), hastaElMuro: true },
};

/**
 * The floor drawn on a grid: walls, corridors and the rest of the structure, bookable spaces with
 * their state for the chosen slot and their windows, and the floor services, shown but never
 * booked. Every layout is just rectangles here: nothing below depends on which one it is.
 */
export function PlanoPiso({ plano, seleccionadoId, onSeleccionar, modo }: PlanoPisoProps) {
  const { piso, espacios, servicios, areas } = plano;

  return (
    <div className="plano-wrap">
      <div className="plano" role="group" aria-label={`Plano del ${piso.nombre.toLowerCase()}, ${piso.disposicion.toLowerCase()}`}>
        <div className="plano-grid" style={{ gridTemplateColumns: `repeat(${piso.columnas}, minmax(0, 1fr))`, gridTemplateRows: plantillaFilas(plano) }}>
          {areas.map((a) => <Area key={a.id} area={a} piso={piso} />)}
          {espacios.map((e) => (
            <Espacio
              key={e.id}
              espacio={e}
              piso={piso}
              seleccionado={e.id === seleccionadoId}
              abrible={modo === 'admin' || (e.estado === 'LIBRE' && e.cumpleFiltros)}
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

function Area({ area: a, piso }: { area: AreaEnPlano; piso: Plano['piso'] }) {
  const forma = AREA[a.tipo];
  const estilo: CSSProperties = { ...area(a.posicion) };
  if (forma.hastaElMuro) {
    // Corridors and terraces run up to the outer wall, across the plan's padding.
    const b = bordes(a.posicion, piso);
    Object.assign(estilo, { marginTop: b.n ? -22 : 0, marginBottom: b.s ? -22 : 0, marginLeft: b.o ? -22 : 0, marginRight: b.e ? -22 : 0 });
  }
  return (
    <div className={`${forma.clase} ${esVertical(a.posicion) ? `${forma.clase}-v` : ''}`} style={estilo}>
      {forma.icono && <Icon name={forma.icono} size={16} />}
      <span>{forma.texto(a)}</span>
    </div>
  );
}

interface EspacioProps {
  espacio: EspacioEnPlano;
  piso: Plano['piso'];
  seleccionado: boolean;
  abrible: boolean;
  referencia: string;
  modo: 'cliente' | 'admin';
  onClick: () => void;
}

function Espacio({ espacio: e, piso, seleccionado, abrible, referencia, modo, onClick }: EspacioProps) {
  const sala = e.tipo !== 'CUBICULO';
  const arriba = abreArriba(e.posicion, piso);
  const ventana = ventanaDe(e, piso);
  const clase = seleccionado ? 'tile-sel' : ESTADO_CLASE[e.estado];
  const texto = seleccionado
    ? 'Seleccionado'
    : e.estado !== 'LIBRE' && sala && e.ocupacion
      ? `${ESTADO_TEXTO[e.estado]} · ${horaDe(e.ocupacion.inicio)}–${horaDe(e.ocupacion.fin)}`
      : ESTADO_TEXTO[e.estado];

  return (
    <div className="tile-cell" style={area(e.posicion)}>
      {ventana && <span className={`ventana ventana-${ventana.lado} ${ventana.enMuro ? 'ventana-muro' : ''}`} aria-hidden="true" />}
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

/** Legend entries of the structural areas, shown only for the kinds the floor has. */
const REFERENCIA_AREA: Record<Exclude<TipoArea, 'PASILLO'>, { clase: string; titulo: string; texto: string }> = {
  NUCLEO: { clase: 'area-nucleo', titulo: 'Núcleo', texto: 'Ascensores y escaleras' },
  APOYO: { clase: 'area-apoyo', titulo: 'Apoyo', texto: 'Cabinas, impresión, jardín, office o depósito. No se reserva' },
  EXTERIOR: { clase: 'area-exterior', titulo: 'Terraza o patio', texto: 'Al aire libre: los espacios de al lado tienen ventanal' },
};

export function Referencias({ areas = [] }: { areas?: AreaEnPlano[] }) {
  const presentes = new Set(areas.map((a) => a.tipo));
  const items = [
    { clase: 'tile-libre', titulo: 'Libre', texto: 'Se puede reservar en esta franja' },
    { clase: 'tile-ocupado', titulo: 'Ocupado', texto: 'Ya reservado por otra persona' },
    { clase: 'tile-bloqueado', titulo: 'Bloqueado', texto: 'Mantenimiento, limpieza o evento' },
    { clase: 'tile-sel', titulo: 'Seleccionado', texto: 'Lo que estás por reservar' },
    { clase: 'tile-servicio', titulo: 'Servicio del piso', texto: 'Baño, cocina, sala de estar. No se reserva' },
    { clase: 'swatch-ventana', titulo: 'Ventana', texto: 'Marca azul sobre el muro o hacia la terraza' },
    ...(Object.keys(REFERENCIA_AREA) as (keyof typeof REFERENCIA_AREA)[]).filter((t) => presentes.has(t)).map((t) => REFERENCIA_AREA[t]),
  ];
  return (
    <div className="card">
      <div className="card-hd">
        <h2 className="t-sm font-semibold">Referencias</h2>
      </div>
      <ul className="card-bd flex flex-col gap-3.5">
        {items.map((i) => (
          <li key={i.titulo} className="flex items-start gap-3">
            <span className={`swatch ${i.clase.startsWith('tile') ? 'tile' : ''} ${i.clase}`} aria-hidden="true">
              {i.clase === 'tile-sel' ? <Icon name="check" size={12} className="absolute top-0.5 right-0.5 text-[color:var(--on-accent)]" /> : <i className="tile-glyph" />}
            </span>
            <span className="flex flex-col">
              <b className="t-sm font-semibold">{i.titulo}</b>
              <span className="t-xs muted">{i.texto}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Layout of the floor ("Núcleo central"), next to its name and in the list of floors. */
export function DisposicionChip({ disposicion }: { disposicion: string }) {
  return (
    <span className="chip" title="Disposición de la planta">
      <Icon name="layers" size={14} />
      {disposicion}
    </span>
  );
}
