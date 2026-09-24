import type { Comodidad, TipoEspacio } from '../types/reservas';
import type { IconName } from '../components/ui/Icon';
import { fechaLarga, hoyISO, sumarDias } from './fechas';

/** "NC" for "Nexo Corporativo". */
export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

/**
 * Which day a "libres" count refers to. The API counts today while the building still has time
 * left, and the next weekday once it closed; the label has to say which.
 */
export function etiquetaJornada(jornadas: string[]): string {
  const unicas = [...new Set(jornadas)];
  const hoy = hoyISO();
  if (unicas.length === 0 || unicas.every((j) => j === hoy)) return 'hoy';
  if (unicas.every((j) => j === sumarDias(hoy, 1))) return 'mañana';
  if (unicas.length === 1) return `el ${fechaLarga(unicas[0], false).split(' ')[0]}`;
  return 'en la próxima jornada';
}

/** Subtitle of the listings: "disponibilidad de hoy, miércoles 26 de agosto". */
export function subtituloJornada(jornadas: string[]): string {
  const unicas = [...new Set(jornadas)].sort();
  const etiqueta = etiquetaJornada(unicas);
  if (unicas.length !== 1) return `disponibilidad de la próxima jornada de cada edificio`;
  return `disponibilidad de ${etiqueta === 'hoy' || etiqueta === 'mañana' ? `${etiqueta}, ` : ''}${fechaLarga(unicas[0], false)}`;
}

export const ICONO_COMODIDAD: Record<Comodidad['tipo'], IconName> = {
  COCINA: 'kitchen',
  SALA_ESTAR: 'sofa',
  BANO: 'wc',
  LUZ_NATURAL: 'sun',
};

export const ICONO_SERVICIO: Record<string, IconName> = {
  COCINA: 'kitchen',
  SALA_ESTAR: 'sofa',
  BANO: 'wc',
};

export const TIPOS_ESPACIO: { valor: TipoEspacio; label: string; corto: string }[] = [
  { valor: 'CUBICULO', label: 'Cubículo', corto: 'Cubículo' },
  { valor: 'SALA_REUNIONES', label: 'Sala de reuniones', corto: 'Reuniones' },
  { valor: 'SALA_PRESENTACIONES', label: 'Sala de presentaciones', corto: 'Presentaciones' },
  { valor: 'SALA_CONFERENCIAS', label: 'Sala de conferencias', corto: 'Conferencias' },
];

export function tipoCorto(tipo: TipoEspacio): string {
  return TIPOS_ESPACIO.find((t) => t.valor === tipo)?.corto ?? tipo;
}

/** Icon for an equipment item, by its first word ("Monitor 24\"" → monitor). */
export function iconoEquipamiento(item: string): IconName {
  const nombre = item.toLowerCase();
  if (nombre.startsWith('monitor') || nombre.startsWith('pantalla') || nombre.startsWith('proyector')) return 'monitor';
  if (nombre.startsWith('wi-fi')) return 'wifi';
  if (nombre.startsWith('luz') || nombre.startsWith('lámpara')) return 'sun';
  if (nombre.startsWith('silla') || nombre.startsWith('mesa')) return 'user';
  if (nombre.startsWith('cajonera')) return 'lock';
  return 'plus';
}

export function nombrePiso(numero: number): string {
  return numero === 0 ? 'PB' : String(numero);
}
