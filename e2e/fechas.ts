// Dates as the API speaks them: local ISO strings, no time-zone conversion.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function isoFecha(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function hoyISO(): string {
  return isoFecha(new Date());
}

export function sumarDias(iso: string, dias: number): string {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  fecha.setDate(fecha.getDate() + dias);
  return isoFecha(fecha);
}

export function esFinDeSemana(iso: string): boolean {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  const diaSemana = new Date(anio, mes - 1, dia).getDay();
  return diaSemana === 0 || diaSemana === 6;
}

/** A weekday `dias` ahead: the buildings are closed on weekends. */
export function diaHabilFuturo(dias: number): string {
  let fecha = sumarDias(hoyISO(), dias);
  while (esFinDeSemana(fecha)) fecha = sumarDias(fecha, 1);
  return fecha;
}

export function minutos(hhmm: string): number {
  const [hora, minuto] = hhmm.slice(0, 5).split(':').map(Number);
  return hora * 60 + minuto;
}

export function hhmm(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Slots of 30 minutes between opening and closing, without the last one (a booking needs an end). */
export function horasCada30(apertura: string, cierre: string): string[] {
  const horas: string[] = [];
  for (let minuto = minutos(apertura); minuto < minutos(cierre); minuto += 30) horas.push(hhmm(minuto));
  return horas;
}

export function fechaHora(fecha: string, hora: string): string {
  return `${fecha}T${hora}:00`;
}

/**
 * Matches the date box of a reservation row ("11" and "ENE" are two adjacent elements, so the text
 * comes out as "11ENE"). Used to pick the row of a booking in Mis reservas.
 */
export function patronDiaMes(iso: string): RegExp {
  const [, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  const abreviaturas = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return new RegExp(`${String(dia).padStart(2, '0')}\\s*${abreviaturas[mes - 1]}`);
}

export function nombreDia(iso: string): string {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return DIAS[new Date(anio, mes - 1, dia).getDay()];
}
