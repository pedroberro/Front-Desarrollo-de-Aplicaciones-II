// Shapes of the catalog and bookings API. Dates travel as local ISO strings ("2026-08-26T10:00:00"),
// in the building's time zone, so they are never converted to the browser's.

export type TipoEspacio = 'CUBICULO' | 'SALA_REUNIONES' | 'SALA_PRESENTACIONES' | 'SALA_CONFERENCIAS';
export type TipoServicio = 'COCINA' | 'SALA_ESTAR' | 'BANO';
/** Structural parts of a floor plan: drawn, never booked. */
export type TipoArea = 'PASILLO' | 'NUCLEO' | 'APOYO' | 'EXTERIOR';
export type EstadoEspacio = 'LIBRE' | 'OCUPADO' | 'BLOQUEADO';
export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA';
export type MotivoBloqueo = 'MANTENIMIENTO' | 'LIMPIEZA' | 'EVENTO' | 'OTRO';

export interface Ref {
  id: number;
  nombre: string;
}

export interface Franja {
  inicio: string;
  fin: string;
}

export interface Comodidad {
  tipo: 'COCINA' | 'SALA_ESTAR' | 'BANO' | 'LUZ_NATURAL';
  etiqueta: string;
}

export interface EmpresaResumen {
  id: number;
  nombre: string;
  rubro: string;
  tono: string;
  edificios: number;
  localidades: string[];
  espaciosLibres: number;
  jornadas: string[];
}

export interface EdificioResumen {
  id: number;
  nombre: string;
  direccion: string;
  localidad: string;
  apertura: string;
  cierre: string;
  tono: string;
  pisos: number;
  espacios: number;
  espaciosLibres: number;
  jornada: string;
}

export interface EmpresaDetalle {
  empresa: EmpresaResumen;
  edificios: EdificioResumen[];
}

export interface PisoResumen {
  id: number;
  numero: number;
  nombre: string;
  espacios: number;
  cubiculos: number;
  salas: number;
  comodidades: Comodidad[];
  libres: number;
  /** Label of the floor's layout, e.g. "Núcleo central". */
  disposicion: string;
}

export interface EdificioDetalle {
  edificio: EdificioResumen;
  empresa: Ref;
  franja: Franja;
  abiertoAhora: boolean;
  libres: number;
  pisos: PisoResumen[];
}

export interface EdificioRef {
  id: number;
  nombre: string;
  direccion: string;
  apertura: string;
  cierre: string;
}

export interface Posicion {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export interface EspacioEnPlano {
  id: number;
  codigo: string;
  tipo: TipoEspacio;
  tipoEtiqueta: string;
  capacidad: number;
  ventana: boolean;
  /** Side of the window: Norte, Sur, Este, Oeste; Interior when it has none. */
  orientacion: string;
  equipamiento: string[];
  posicion: Posicion;
  estado: EstadoEspacio;
  ocupacion: Franja | null;
  proximoLibre: Franja | null;
  cumpleFiltros: boolean;
}

export interface ServicioEnPlano {
  id: number;
  tipo: TipoServicio;
  nombre: string;
  posicion: Posicion;
}

/** Corridor, elevator core, support area (lockers, building services) or terrace. */
export interface AreaEnPlano {
  id: number;
  tipo: TipoArea;
  etiqueta: string;
  posicion: Posicion;
}

export interface ResumenPlano {
  total: number;
  libres: number;
  ocupados: number;
  bloqueados: number;
}

export interface PlanoPiso {
  piso: {
    id: number;
    numero: number;
    nombre: string;
    columnas: number;
    filas: number;
    /** Label of the layout. The plan is drawn from the areas, never from this. */
    disposicion: string;
    ventanas: string[];
    comodidades: Comodidad[];
  };
  edificio: EdificioRef;
  empresa: Ref;
  franja: Franja;
  espacios: EspacioEnPlano[];
  servicios: ServicioEnPlano[];
  areas: AreaEnPlano[];
  resumen: ResumenPlano;
  otrosPisos: { id: number; nombre: string; libres: number }[];
  sugerencia: Franja | null;
}

export interface Condiciones {
  pasoMinutos: number;
  minimaMinutos: number;
  maximaMinutos: number;
  anticipacionMaximaDias: number;
}

export interface EspacioDetalle {
  id: number;
  codigo: string;
  tipo: TipoEspacio;
  tipoEtiqueta: string;
  capacidad: number;
  ventana: boolean;
  descripcion: string;
  superficie: number;
  orientacion: string;
  ubicacion: string;
  ruido: string;
  climatizacion: string;
  equipamiento: string[];
  piso: { id: number; numero: number; nombre: string };
  edificio: EdificioRef;
  empresa: Ref;
  serviciosCercanos: { tipo: TipoServicio; nombre: string; metros: number }[];
  condiciones: Condiciones;
}

export interface OcupacionCalendario {
  tipo: 'RESERVA' | 'BLOQUEO';
  inicio: string;
  fin: string;
  propia: boolean;
  reservaId: number | null;
  codigo: string | null;
  estado: EstadoReserva | null;
  cliente: string | null;
  motivo: string | null;
}

export interface AgendaEspacio {
  espacioId: number;
  apertura: string;
  cierre: string;
  desde: string;
  hasta: string;
  ahora: string;
  ocupaciones: OcupacionCalendario[];
}

export interface EspacioBreve {
  id: number;
  codigo: string;
  tipo: TipoEspacio;
  tipoEtiqueta: string;
  capacidad: number;
}

export interface EdificioConPisos {
  id: number;
  nombre: string;
  empresa: string;
  apertura: string;
  cierre: string;
  pisos: { id: number; numero: number; nombre: string }[];
}

export interface ClienteRef {
  id: number;
  nombre: string;
  email: string;
}

export interface Cambio {
  fecha: string;
  autor: string;
  motivo: string;
  detalle: string;
}

export interface Reserva {
  id: number;
  codigo: string;
  estado: EstadoReserva;
  inicio: string;
  fin: string;
  duracionMinutos: number;
  espacio: EspacioBreve;
  piso: Ref;
  edificio: Ref;
  empresa: Ref;
  cliente: ClienteRef;
  creadaPorAdmin: boolean;
  cancelable: boolean;
  creadaEl: string;
  cambios: Cambio[] | null;
}

export interface MisReservas {
  proximas: Reserva[];
  historial: Reserva[];
}

export interface PaginaReservas {
  content: Reserva[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  totalGeneral: number;
}

export interface BloqueAgenda {
  tipo: 'RESERVA' | 'BLOQUEO';
  id: number;
  espacioId: number;
  inicio: string;
  fin: string;
  estado: EstadoReserva | null;
  cliente: ClienteRef | null;
  motivo: MotivoBloqueo | null;
  motivoEtiqueta: string | null;
  detalle: string | null;
  grupo: string | null;
}

export interface AgendaPiso {
  piso: Ref;
  edificio: EdificioRef;
  fecha: string;
  ahora: string;
  espacios: EspacioBreve[];
  bloques: BloqueAgenda[];
}

export interface Bloqueo {
  id: number;
  grupo: string;
  espacio: EspacioBreve;
  piso: Ref;
  edificio: Ref;
  inicio: string;
  fin: string;
  motivo: MotivoBloqueo;
  motivoEtiqueta: string;
  detalle: string;
  creadoPor: string;
  creadoEl: string;
}

export interface FranjaTomadaBody {
  message: string;
  code: 'FRANJA_OCUPADA';
  alternativas: Franja[];
}

export interface FiltroPlano {
  fecha?: string;
  desde?: string;
  hasta?: string;
  tipo?: TipoEspacio;
  capacidadMinima?: number;
  ventana?: boolean;
}

export interface FiltroReservas {
  edificioId?: number;
  pisoId?: number;
  espacioId?: number;
  tipo?: TipoEspacio;
  desde?: string;
  hasta?: string;
  estado?: EstadoReserva;
  q?: string;
  page?: number;
  size?: number;
}

export interface AdminReservaRequest {
  usuarioId: number;
  espacioId: number;
  inicio: string;
  fin: string;
  estado?: EstadoReserva;
  motivo?: string;
}

export interface CrearBloqueoRequest {
  alcance: 'ESPACIO' | 'PISO';
  espacioId?: number;
  pisoId?: number;
  inicio: string;
  fin: string;
  motivo: MotivoBloqueo;
  detalle: string;
}
