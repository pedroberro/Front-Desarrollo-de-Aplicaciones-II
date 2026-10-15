import type { PlanoPiso, Posicion } from '../../types/reservas';

/**
 * Pure geometry of a floor plan. Nothing here knows the layout (central corridor, core, comb, L):
 * every floor is rectangles on a grid, and these helpers only read the rectangles.
 */

type Piso = PlanoPiso['piso'];
export type Lado = 'n' | 's' | 'e' | 'o';

const LADO: Record<string, Lado> = { Norte: 'n', Sur: 's', Este: 'e', Oeste: 'o' };

/** Which outer walls of the building a rectangle touches. */
export function bordes(p: Posicion, piso: Piso): Record<Lado, boolean> {
  return { n: p.y === 0, s: p.y + p.alto === piso.filas, o: p.x === 0, e: p.x + p.ancho === piso.columnas };
}

/**
 * Where to draw a space's window: the side it faces, and whether that side is the building's outer
 * wall (the mark goes on the wall) or a terrace or patio next to it (the mark goes on its edge).
 */
export function ventanaDe(e: { ventana: boolean; orientacion: string; posicion: Posicion }, piso: Piso): { lado: Lado; enMuro: boolean } | null {
  const lado = e.ventana ? LADO[e.orientacion] : undefined;
  if (!lado) return null;
  return { lado, enMuro: bordes(e.posicion, piso)[lado] };
}

/** Rows that only hold corridor are drawn short; the rest grow with their tiles. */
export function plantillaFilas(plano: PlanoPiso): string {
  const { piso } = plano;
  const tipos = Array.from({ length: piso.filas }, () => new Set<string>());
  const marcar = (p: Posicion, tipo: string) => {
    for (let y = p.y; y < p.y + p.alto && y < piso.filas; y++) tipos[y]!.add(tipo);
  };
  plano.espacios.forEach((e) => marcar(e.posicion, 'ESPACIO'));
  plano.servicios.forEach((s) => marcar(s.posicion, 'SERVICIO'));
  plano.areas.forEach((a) => marcar(a.posicion, a.tipo));
  return tipos.map((t) => (t.size === 1 && t.has('PASILLO') ? '58px' : 'auto')).join(' ');
}

/** A tall, narrow area (a corridor running north-south) gets its label written vertically. */
export function esVertical(p: Posicion): boolean {
  return p.ancho * 0.3 < p.alto;
}

/** Hover cards open towards the inside of the plan, so they are never cut by its edge. */
export function abreArriba(p: Posicion, piso: Piso): boolean {
  return p.y + p.alto / 2 > piso.filas / 2;
}
