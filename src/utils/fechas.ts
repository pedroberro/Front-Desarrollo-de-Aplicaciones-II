// Date helpers for the booking screens. The API speaks local ISO strings ("2026-08-26T10:00:00") in the
// building's time zone; these helpers only slice and format them, so no value is ever shifted by the
// browser's zone.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "YYYY-MM-DD" of a local Date. */
export function isoFecha(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Local Date at midnight for "YYYY-MM-DD" (new Date("YYYY-MM-DD") would be UTC). */
export function aFecha(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function hoyISO(): string {
  return isoFecha(new Date());
}

export function sumarDias(iso: string, dias: number): string {
  const f = aFecha(iso);
  f.setDate(f.getDate() + dias);
  return isoFecha(f);
}

export function diaDeSemana(iso: string): number {
  return aFecha(iso).getDay();
}

export function esFinDeSemana(iso: string): boolean {
  const d = diaDeSemana(iso);
  return d === 0 || d === 6;
}

/** The same day if it is a weekday, otherwise the next Monday. Buildings close on weekends. */
export function proximoHabil(iso: string): string {
  let dia = iso;
  while (esFinDeSemana(dia)) dia = sumarDias(dia, 1);
  return dia;
}

/** Monday of the week of the day (the following one for weekends, where the calendar has nothing to show). */
export function lunesDe(iso: string): string {
  const d = diaDeSemana(iso);
  if (d === 0) return sumarDias(iso, 1);
  if (d === 6) return sumarDias(iso, 2);
  return sumarDias(iso, 1 - d);
}

export function fechaDe(fechaHora: string): string {
  return fechaHora.slice(0, 10);
}

export function horaDe(fechaHora: string): string {
  return fechaHora.slice(11, 16);
}

export function minutos(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

export function hhmm(totalMinutos: number): string {
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Minutes since midnight of a "YYYY-MM-DDTHH:mm:ss" value. */
export function minutosDelDia(fechaHora: string): number {
  return minutos(horaDe(fechaHora));
}

export function fechaHora(fecha: string, hora: string): string {
  return `${fecha}T${hora.slice(0, 5)}:00`;
}

/** "miércoles 26 de agosto de 2026" */
export function fechaLarga(iso: string, conAnio = true): string {
  const f = aFecha(iso);
  return `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}${conAnio ? ` de ${f.getFullYear()}` : ''}`;
}

/** "mié 26 ago 2026" */
export function fechaCorta(iso: string, conAnio = true): string {
  const f = aFecha(iso);
  return `${DIAS_CORTOS[f.getDay()]} ${f.getDate()} ${MESES_CORTOS[f.getMonth()]}${conAnio ? ` ${f.getFullYear()}` : ''}`;
}

/** "26 ago" */
export function diaMes(iso: string): string {
  const f = aFecha(iso);
  return `${f.getDate()} ${MESES_CORTOS[f.getMonth()]}`;
}

export function partesFecha(iso: string): { dia: string; mes: string; semana: string } {
  const f = aFecha(iso);
  return {
    dia: String(f.getDate()).padStart(2, '0'),
    mes: MESES_CORTOS[f.getMonth()].toUpperCase(),
    semana: DIAS_CORTOS[f.getDay()].toUpperCase(),
  };
}

/** "24 – 28 de agosto de 2026", or across months "31 de agosto – 4 de septiembre de 2026". */
export function rangoDeDias(desde: string, hasta: string): string {
  const a = aFecha(desde);
  const b = aFecha(hasta);
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()} – ${b.getDate()} de ${MESES[b.getMonth()]} de ${b.getFullYear()}`;
  }
  return `${a.getDate()} de ${MESES[a.getMonth()]} – ${b.getDate()} de ${MESES[b.getMonth()]} de ${b.getFullYear()}`;
}

/** "10:00 – 11:30" */
export function rangoHorario(inicio: string, fin: string): string {
  return `${horaDe(inicio)} – ${horaDe(fin)}`;
}

/** "1 h 30 min", "2 h", "30 min" */
export function duracion(totalMinutos: number): string {
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function minutosEntre(inicio: string, fin: string): number {
  const dias = Math.round((aFecha(fechaDe(fin)).getTime() - aFecha(fechaDe(inicio)).getTime()) / 86_400_000);
  return dias * 1440 + minutosDelDia(fin) - minutosDelDia(inicio);
}

/** Every half hour between two "HH:mm" values, both included. */
export function horasCada30(desde: string, hasta: string): string[] {
  const opciones: string[] = [];
  for (let m = minutos(desde); m <= minutos(hasta); m += 30) opciones.push(hhmm(m));
  return opciones;
}

/** "ahora", "11:30", "mañana 08:00" or "lun 31 ago 08:00", relative to the slot being looked at. */
export function cuandoLibre(libre: string, referencia: string): string {
  if (libre <= referencia) return 'ahora';
  const dia = fechaDe(libre);
  if (dia === fechaDe(referencia)) return horaDe(libre);
  if (dia === sumarDias(fechaDe(referencia), 1)) return `mañana ${horaDe(libre)}`;
  return `${fechaCorta(dia, false)} ${horaDe(libre)}`;
}

/** Local "now" as the API writes it, to compare with its values. */
export function ahoraISO(): string {
  const d = new Date();
  return `${isoFecha(d)}T${hhmm(d.getHours() * 60 + d.getMinutes())}:00`;
}
