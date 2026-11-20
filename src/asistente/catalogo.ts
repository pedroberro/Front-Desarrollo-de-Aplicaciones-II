import type { IconName } from '../components/ui/Icon';
import type { AccionAsistente } from './acciones';

export type IdCategoria = 'reservas' | 'pagos' | 'cancelaciones' | 'cuenta';

export interface PreguntaAsistente {
  id: string;
  texto: string;
  respuesta: string;
  /** Sinónimos y palabras sueltas con las que también se llega a esta respuesta. */
  claves: string[];
  /** Pantalla a la que conviene llevar después de la respuesta. */
  accion?: AccionAsistente;
}

export interface CategoriaAsistente {
  id: IdCategoria;
  nombre: string;
  icono: IconName;
  preguntas: PreguntaAsistente[];
}

/**
 * Respuestas del asistente simulado. Están escritas acá, no se consulta ninguna API:
 * la ventana las muestra como si se estuvieran generando.
 */
export const CATEGORIAS: CategoriaAsistente[] = [
  {
    id: 'reservas',
    nombre: 'Reservas',
    icono: 'calendar',
    preguntas: [
      {
        id: 'reserva-como',
        texto: '¿Cómo realizo mi reserva?',
        respuesta:
          'Podés reservar en unos pasos:\n\n1. Entrá a Empresas y elegí la empresa y el edificio.\n2. Abrí el piso y ubicá el espacio libre en el plano (o pasá a la vista de lista).\n3. Elegí el día y la franja horaria que te sirva.\n4. Revisá el resumen y confirmá con tu método de pago.\n\nLa reserva queda confirmada cuando se acredita el pago y la vas a ver en Mis reservas.',
        claves: ['reservar', 'reserva', 'sacar turno', 'hacer una reserva', 'reservo', 'turno'],
        accion: 'GO_TO_RESERVATIONS',
      },
      {
        id: 'reserva-anticipacion',
        texto: '¿Con cuánta anticipación puedo reservar?',
        respuesta:
          'Cada edificio define hasta cuántos días antes se puede reservar. Ese límite aparece en las condiciones del espacio, junto al plano, y el calendario solo habilita los días permitidos. Si un día no aparece, es porque está fuera de esa ventana.',
        claves: ['anticipacion', 'antes', 'dias', 'adelantado', 'futuro', 'calendario', 'limite'],
      },
      {
        id: 'reserva-duracion',
        texto: '¿Cuánto puede durar una reserva?',
        respuesta:
          'Depende de las condiciones del edificio: hay una duración mínima, una máxima y la franja avanza en bloques (por ejemplo, de 30 minutos). El selector de horarios solo te muestra combinaciones válidas y dentro del horario de apertura del edificio.',
        claves: ['duracion', 'horas', 'horario', 'cuanto tiempo', 'minutos', 'bloques', 'extender'],
      },
      {
        id: 'reserva-dos-espacios',
        texto: '¿Puedo reservar dos espacios al mismo tiempo?',
        respuesta:
          'No. Una misma persona no puede tener dos reservas activas en el mismo horario. Si la franja que elegís se superpone con otra reserva tuya, el sistema te avisa antes de confirmar y te sugiere cancelar la anterior desde Mis reservas.',
        claves: ['dos espacios', 'varios espacios', 'superponer', 'choque', 'mismo horario', 'simultaneo', 'paralelo'],
      },
      {
        id: 'reserva-franja-ocupada',
        texto: '¿Qué pasa si la franja se ocupa mientras confirmo?',
        respuesta:
          'Puede pasar: alguien tomó ese horario mientras confirmabas. En ese caso la reserva no se crea y te mostramos los horarios libres más cercanos en el mismo espacio para que elijas otro al instante.',
        claves: ['ocupada', 'ocupo', 'no disponible', 'conflicto', 'tomada', 'alguien reservo'],
      },
      {
        id: 'reserva-precio',
        texto: '¿Cómo se calcula el precio?',
        respuesta:
          'Cada espacio tiene un precio por hora y el cobro es por minuto: una reserva de una hora y media se cobra como una hora y media. Antes de confirmar ves el total en el resumen.',
        claves: ['precio', 'costo', 'cuanto sale', 'cuanto cuesta', 'tarifa', 'plata', 'cobro', 'minuto', 'reservar'],
      },
      {
        id: 'reserva-codigo',
        texto: '¿Dónde veo el código de mi reserva?',
        respuesta:
          'Cada reserva tiene un código único (por ejemplo, R-0040). Lo encontrás en Mis reservas y en el detalle de la reserva, junto al espacio, el día y el horario.',
        claves: ['codigo', 'identificar', 'numero de reserva', 'comprobante', 'referencia'],
        accion: 'GO_TO_MY_RESERVATIONS',
      },
      {
        id: 'reserva-donde',
        texto: '¿Dónde veo mis reservas?',
        respuesta:
          'En la sección Mis reservas. Las próximas aparecen primero, con su estado y el botón para cancelar; las que ya pasaron o cancelaste quedan en la pestaña Historial. Si entrás al detalle de una reserva, ves también el historial de cambios.',
        claves: ['ver reservas', 'mis reservas', 'consultar', 'listado', 'historial', 'donde estan'],
        accion: 'GO_TO_MY_RESERVATIONS',
      },
    ],
  },
  {
    id: 'pagos',
    nombre: 'Pagos',
    icono: 'card',
    preguntas: [
      {
        id: 'pago-necesito',
        texto: '¿Debo contar con un método de pago para reservar?',
        respuesta:
          'Sí, para reservar necesitás al menos una tarjeta guardada: el cobro se hace con la tarjeta que elijas en el resumen. Si todavía no tenés ninguna, agregala desde Mi perfil y volvé a elegir la franja.',
        claves: ['metodo de pago', 'tarjeta', 'pagar', 'necesito', 'obligatorio', 'sin tarjeta', 'no tengo tarjeta'],
        accion: 'GO_TO_PROFILE',
      },
      {
        id: 'pago-varios',
        texto: '¿Puedo tener más de un método de pago?',
        respuesta:
          'Sí. Podés guardar hasta 3 tarjetas de crédito o débito. Una es la principal y se usa por defecto al reservar, pero podés cambiarla cuando quieras desde Mi perfil.',
        claves: ['varias', 'varios', 'mas de una', 'mas de un metodo', 'varios metodos', 'tres', 'tarjetas', 'guardar', 'cambiar de tarjeta'],
      },
      {
        id: 'pago-cuando',
        texto: '¿Cuándo se me cobra la reserva?',
        respuesta:
          'Al confirmar la reserva. Mientras el pago se procesa, la reserva queda Pendiente; pasa a Confirmada en cuanto se acredita. Si el pago se rechaza, la reserva se cancela automáticamente y la franja vuelve a quedar libre.',
        claves: ['cuando', 'cobran', 'cobra', 'pago', 'pendiente', 'confirmada', 'acredita'],
      },
      {
        id: 'pago-rechazado',
        texto: '¿Qué pasa si mi pago es rechazado?',
        respuesta:
          'Si el pago se rechaza, la reserva se cancela sola y la franja vuelve a estar disponible. Podés intentar de nuevo eligiendo otra tarjeta o revisando los datos de la que usaste.',
        claves: ['rechazado', 'rechaza', 'falla', 'error de pago', 'no se cobro', 'rebotado'],
      },
      {
        id: 'pago-principal',
        texto: '¿Cómo cambio mi tarjeta principal?',
        respuesta:
          'En Mi perfil → Métodos de pago, tocá «Hacer principal» en la tarjeta que quieras usar por defecto. Esa va a ser la que aparezca seleccionada al reservar.',
        claves: ['principal', 'predeterminada', 'default', 'cambiar tarjeta', 'tarjeta por defecto'],
        accion: 'GO_TO_PROFILE',
      },
      {
        id: 'pago-eliminar',
        texto: '¿Puedo eliminar una tarjeta guardada?',
        respuesta:
          'Sí. En Mi perfil, cada tarjeta tiene un botón para eliminarla. Si borrás la principal, otra de tus tarjetas pasa a serlo automáticamente.',
        claves: ['eliminar', 'borrar', 'quitar', 'sacar tarjeta'],
      },
      {
        id: 'pago-datos',
        texto: '¿Qué datos necesito para agregar una tarjeta?',
        respuesta:
          'Necesitás el número de la tarjeta (13 a 19 dígitos), el titular, el vencimiento en formato MM/AA y el código de seguridad. No se aceptan tarjetas vencidas. Solo guardamos el titular, el vencimiento y los últimos cuatro dígitos.',
        claves: ['agregar tarjeta', 'cargar tarjeta', 'datos', 'vencimiento', 'codigo de seguridad', 'numero de tarjeta'],
      },
    ],
  },
  {
    id: 'cancelaciones',
    nombre: 'Cancelaciones',
    icono: 'ban',
    preguntas: [
      {
        id: 'cancelar-puedo',
        texto: '¿Puedo cancelar mi reserva?',
        respuesta:
          'Sí, podés cancelar cualquier reserva Pendiente o Confirmada que todavía no haya empezado. Una vez que la reserva comenzó, ya no se puede cancelar.',
        claves: ['cancelar', 'anular', 'dar de baja', 'deshacer', 'puedo cancelar'],
      },
      {
        id: 'cancelar-como',
        texto: '¿Cómo cancelo mi reserva?',
        respuesta:
          'Entrá a Mis reservas, pestaña Próximas, y tocá «Cancelar» en la reserva. Antes de confirmar vas a ver cuánto se te reintegra; al aceptar, la franja queda libre para otras personas.',
        claves: ['como cancelo', 'cancelar', 'anular', 'donde cancelo', 'procedimiento'],
        accion: 'GO_TO_MY_RESERVATIONS',
      },
      {
        id: 'cancelar-reintegro',
        texto: '¿Me devuelven el dinero si cancelo?',
        respuesta:
          'Depende de cuánto falte para el inicio. Las condiciones del edificio indican hasta cuándo se devuelve el total, hasta cuándo un porcentaje y desde cuándo no hay reintegro. En el diálogo de cancelación ves el monto exacto que vuelve a tu tarjeta.',
        claves: ['reintegro', 'devolucion', 'reembolso', 'dinero', 'plata', 'porcentaje', 'devuelven'],
      },
      {
        id: 'cancelar-empezada',
        texto: '¿Puedo cancelar una reserva que ya empezó?',
        respuesta:
          'No. Solo se pueden cancelar reservas que todavía no comenzaron. Cuando terminan, pasan solas al Historial de Mis reservas.',
        claves: ['ya empezo', 'en curso', 'ya paso', 'terminada', 'pasada', 'empezada'],
      },
      {
        id: 'cancelar-costo',
        texto: '¿Cancelar tiene algún costo?',
        respuesta:
          'Cancelar no tiene costo. Lo que puede pasar es que, según la política del edificio y lo cerca que esté el inicio, el reintegro sea parcial o nulo. Si todavía no se te cobró nada, cancelar no te cuesta nada.',
        claves: ['costo', 'penalidad', 'multa', 'cargo', 'gratis', 'perder plata'],
      },
      {
        id: 'cancelar-admin',
        texto: '¿Por qué se canceló mi reserva sin que la cancele yo?',
        respuesta:
          'Un administrador puede cancelarla si el espacio queda bloqueado, por ejemplo por mantenimiento o por un evento en el piso. En el detalle de la reserva ves el historial de cambios con el motivo, y en esos casos el reintegro es total.',
        claves: ['administrador', 'admin', 'no la cancele', 'desaparecio', 'bloqueo', 'mantenimiento', 'se cancelo sola'],
      },
    ],
  },
  {
    id: 'cuenta',
    nombre: 'Mi cuenta',
    icono: 'user',
    preguntas: [
      {
        id: 'cuenta-telefono',
        texto: '¿Puedo cambiar mi número de teléfono?',
        respuesta:
          'Sí. Andá a Mi perfil y tocá «Cambiar» en el teléfono. El número tiene que tener entre 8 y 15 dígitos. Lo usamos para contactarte si surge algo con una reserva.',
        claves: ['telefono', 'numero', 'celular', 'actualizar telefono', 'cambiar telefono'],
        accion: 'GO_TO_PROFILE',
      },
      {
        id: 'cuenta-password',
        texto: '¿Cómo cambio mi contraseña?',
        respuesta:
          'En Mi perfil, dentro de Datos personales, tocá «Cambiar contraseña». Necesitás tu contraseña actual y una nueva de al menos 8 caracteres, con una letra y un número.',
        claves: ['contrasena', 'password', 'clave', 'cambiar contrasena', 'seguridad'],
        accion: 'GO_TO_PROFILE',
      },
      {
        id: 'cuenta-email',
        texto: '¿Puedo cambiar mi email?',
        respuesta:
          'El email no se puede cambiar desde la aplicación: es el que usás para ingresar y para confirmar tu cuenta. Si necesitás modificarlo, escribinos y lo gestionamos.',
        claves: ['email', 'correo', 'mail', 'cambiar email', 'usuario'],
      },
      {
        id: 'cuenta-nombre',
        texto: '¿Puedo cambiar mi nombre?',
        respuesta:
          'El nombre completo tampoco se edita desde Mi perfil. Si está mal escrito, escribinos y lo corregimos.',
        claves: ['nombre', 'apellido', 'datos personales', 'editar nombre'],
      },
      {
        id: 'cuenta-sesion',
        texto: '¿Cómo cierro sesión?',
        respuesta:
          'Tocá tu nombre en la barra superior y elegí «Cerrar sesión». Volvés a la pantalla de ingreso.',
        claves: ['cerrar sesion', 'salir', 'logout', 'desconectar'],
      },
      {
        id: 'cuenta-olvide',
        texto: 'Olvidé mi contraseña, ¿qué hago?',
        respuesta:
          'En la pantalla de ingreso tocá «¿Olvidaste tu contraseña?», ingresá tu email y te enviamos un link para restablecerla.',
        claves: ['olvide', 'recuperar', 'restablecer', 'reset', 'no me acuerdo', 'olvidaste'],
        accion: 'GO_TO_RECOVERY',
      },
      {
        id: 'cuenta-confirmar',
        texto: '¿Cómo confirmo mi cuenta?',
        respuesta:
          'Después de registrarte te enviamos un mail con un link de confirmación. Al abrirlo, tu cuenta queda activa y entrás directo. Si no llegó, revisá el spam o pedí que te lo enviemos de nuevo desde la misma pantalla.',
        claves: ['confirmar cuenta', 'activar', 'link', 'registro', 'no llego el mail'],
      },
    ],
  },
];

export const SALUDO =
  '¡Hola! Soy el asistente de Planta Libre. Puedo responderte sobre reservas, pagos, cancelaciones y tu cuenta. Elegí una pregunta de abajo o escribila en el campo de texto.';

export const SIN_RESPUESTA =
  'Uy, no tengo una respuesta cargada para eso. Probá con las preguntas de abajo o escribí una palabra clave como «reserva», «pago», «cancelar» o «teléfono».';

const PALABRAS_VACIAS = new Set([
  'que', 'como', 'cual', 'cuales', 'donde', 'cuando', 'cuanto', 'cuanta', 'cuantos', 'cuantas',
  'mi', 'mis', 'me', 'te', 'se', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'a', 'al', 'en', 'con', 'por', 'para', 'es', 'son', 'hay', 'ser', 'esta', 'este', 'esto',
  'puedo', 'podria', 'tengo', 'tener', 'hago', 'hacer', 'quiero', 'necesito', 'sirve', 'hola', 'si', 'no',
]);

/** Minúsculas, sin acentos ni signos: "¿Puedo CANCELAR?" y "puedo cancelar" se comparan igual. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function terminosDe(consulta: string): string[] {
  return normalizar(consulta)
    .split(' ')
    .filter((t) => t.length >= 3 && !PALABRAS_VACIAS.has(t));
}

/**
 * Busca la pregunta más parecida a lo que escribió la persona. Solo devuelve algo si
 * hay coincidencias suficientes: una palabra exacta, o dos coincidencias parciales.
 */
export function buscarPregunta(consulta: string): PreguntaAsistente | null {
  const terminos = terminosDe(consulta);
  if (terminos.length === 0) return null;

  const frase = normalizar(consulta);
  let mejor: { pregunta: PreguntaAsistente; puntaje: number } | null = null;
  for (const categoria of CATEGORIAS) {
    for (const pregunta of categoria.preguntas) {
      const campo = normalizar(`${pregunta.texto} ${pregunta.claves.join(' ')}`);
      const palabras = new Set(campo.split(' '));
      const porPalabras = terminos.reduce((total, t) => total + (palabras.has(t) ? 2 : campo.includes(t) ? 1 : 0), 0);
      // La pregunta escrita tal cual vale más que coincidencias sueltas de palabras.
      const puntaje = porPalabras + (frase.length >= 8 && campo.includes(frase) ? 4 : 0);
      if (puntaje > 0 && (!mejor || puntaje > mejor.puntaje)) mejor = { pregunta, puntaje };
    }
  }

  // Una palabra suelta tiene que coincidir exacta; con varias alcanza una exacta o dos parciales.
  return mejor && mejor.puntaje >= 2 ? mejor.pregunta : null;
}
