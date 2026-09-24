import type { EstadoEspacio, EstadoReserva } from '../../types/reservas';
import { Icon } from './Icon';

// Colour plus a distinct glyph per state (circle, square, triangle), as in the design system:
// the state is readable without relying on colour alone.
const RESERVA: Record<EstadoReserva, { tono: string; glifo: string; texto: string }> = {
  PENDIENTE: { tono: 'b-blk', glifo: 'g-tri', texto: 'Pendiente' },
  CONFIRMADA: { tono: 'b-ok', glifo: 'g-dot', texto: 'Confirmada' },
  CANCELADA: { tono: 'b-busy', glifo: 'g-sq', texto: 'Cancelada' },
  FINALIZADA: { tono: 'b-neutral', glifo: 'g-dot', texto: 'Finalizada' },
};

const ESPACIO: Record<EstadoEspacio, { tono: string; glifo: string; texto: string }> = {
  LIBRE: { tono: 'b-ok', glifo: 'g-dot', texto: 'Libre' },
  OCUPADO: { tono: 'b-busy', glifo: 'g-sq', texto: 'Ocupado' },
  BLOQUEADO: { tono: 'b-blk', glifo: 'g-tri', texto: 'Bloqueado' },
};

export function EstadoReservaBadge({ estado, small = true }: { estado: EstadoReserva; small?: boolean }) {
  const e = RESERVA[estado];
  return (
    <span className={`badge ${e.tono} ${small ? 'badge-sm' : ''}`}>
      <i className={e.glifo} aria-hidden="true" />
      {e.texto}
    </span>
  );
}

export function EstadoEspacioBadge({ estado, small = true }: { estado: EstadoEspacio; small?: boolean }) {
  const e = ESPACIO[estado];
  return (
    <span className={`badge ${e.tono} ${small ? 'badge-sm' : ''}`}>
      <i className={e.glifo} aria-hidden="true" />
      {e.texto}
    </span>
  );
}

export function BloqueoBadge() {
  return (
    <span className="badge b-blk badge-sm">
      <Icon name="lock" size={12} />
      Bloqueo
    </span>
  );
}

/** "11 de 17 libres": green while something is free, red when nothing is. */
export function ContadorLibres({ libres, total }: { libres: number; total: number }) {
  return (
    <span className={`badge ${libres > 0 ? 'b-ok' : 'b-busy'} mono`} role="status">
      <i className={libres > 0 ? 'g-dot' : 'g-sq'} aria-hidden="true" />
      {libres} de {total} libres
    </span>
  );
}

export const ETIQUETA_ESTADO_RESERVA: Record<EstadoReserva, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  FINALIZADA: 'Finalizada',
};
