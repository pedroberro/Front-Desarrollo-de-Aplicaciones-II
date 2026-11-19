/** Identificadores de navegación permitidos para las respuestas del asistente. */
export type AccionAsistente =
  | 'GO_TO_RESERVATIONS'
  | 'GO_TO_MY_RESERVATIONS'
  | 'GO_TO_AVAILABILITY';

interface DestinoAsistente {
  etiqueta: string;
  ruta: string;
}

/**
 * Destinos internos existentes. El asistente selecciona un identificador, nunca una URL;
 * la autorización de cada pantalla sigue a cargo de las rutas protegidas.
 */
export const DESTINOS_ASISTENTE: Record<AccionAsistente, DestinoAsistente> = {
  GO_TO_RESERVATIONS: { etiqueta: 'Realizar reserva', ruta: '/empresas' },
  GO_TO_MY_RESERVATIONS: { etiqueta: 'Ver mis reservas', ruta: '/mis-reservas' },
  GO_TO_AVAILABILITY: { etiqueta: 'Buscar disponibilidad', ruta: '/empresas' },
};

/** Resuelve solo acciones incluidas en el catálogo; valores desconocidos no navegan. */
export function destinoDeAccionAsistente(accion: string | null | undefined): DestinoAsistente | null {
  if (!accion || !Object.hasOwn(DESTINOS_ASISTENTE, accion)) return null;
  return DESTINOS_ASISTENTE[accion as AccionAsistente];
}
