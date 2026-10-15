import type { Condiciones, ReintegroSiCancela } from '../types/reservas';

/** Money and cancellation policy as the screens word them. Pure: the API holds the rules. */

const PESOS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

export function pesos(monto: number): string {
  return PESOS.format(monto);
}

/** What a slot costs: the hourly price prorated by minute, like the API charges it. */
export function montoEstimado(precioHora: number, minutos: number): number {
  return Math.round(precioHora * minutos * 100 / 60) / 100;
}

/** The cancellation policy in three lines, from the same values the API applies. */
export function lineasPolitica(c: Condiciones): string[] {
  return [
    `Hasta ${c.cancelacionSinCargoHoras} h antes del inicio: te devolvemos todo.`,
    `Entre ${c.cancelacionSinCargoHoras} h y ${c.cancelacionConRetencionHoras} h antes: te devolvemos el ${c.reintegroParcialPorcentaje}%.`,
    `Con menos de ${c.cancelacionConRetencionHoras} h: podés cancelar para liberar el lugar, pero no hay reintegro.`,
  ];
}

/** What cancelling now gives back, for the cancel dialog. */
export function textoReintegro(r: ReintegroSiCancela | null): string {
  if (!r) return '';
  if (r.monto === null) return 'Todavía no se te cobró: cancelar no tiene costo.';
  if (r.porcentaje === 100) return `Te devolvemos el total, ${pesos(r.monto)}, a la tarjeta con la que pagaste.`;
  if (r.porcentaje > 0) return `Por la política de cancelación te devolvemos el ${r.porcentaje}%: ${pesos(r.monto)}.`;
  return 'Falta poco para el inicio: por la política de cancelación no hay reintegro.';
}
