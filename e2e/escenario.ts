import { diaHabilFuturo } from './fechas';

/** A weekday beyond the two weeks of demo bookings, so seeded data never interferes. */
export function diaDeLaCorrida(minimo = 16, maximo = 50): string {
  const dias = minimo + Math.floor(Math.random() * (maximo - minimo + 1));
  return diaHabilFuturo(dias);
}

/**
 * A random half-hour slot of the day. Randomising both the day and the hour keeps a run from
 * colliding with the bookings a previous run left in the same database.
 */
export function ventanaAlAzar(): number {
  return Math.floor(Math.random() * 24);
}
