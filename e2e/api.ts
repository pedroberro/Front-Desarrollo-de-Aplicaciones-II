import { request, type APIRequestContext } from '@playwright/test';
import { hhmm, minutos } from './fechas';

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080/api';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  rol: string;
  estado: string;
  createdAt: string;
  permisos: string[];
}

export interface MedioPago {
  id: number;
  ultimos4: string;
  principal: boolean;
  titular: string;
  vencimiento: string;
}

export interface EdificioConPisos {
  id: number;
  nombre: string;
  empresa: string;
  apertura: string;
  cierre: string;
  pisos: { id: number; numero: number; nombre: string }[];
}

export interface EspacioPlano {
  id: number;
  codigo: string;
  tipoEtiqueta: string;
  capacidad: number;
  estado: 'LIBRE' | 'OCUPADO' | 'BLOQUEADO';
  cumpleFiltros: boolean;
}

export interface Plano {
  piso: { id: number; nombre: string };
  edificio: { id: number; nombre: string; apertura: string; cierre: string };
  espacios: EspacioPlano[];
  resumen: { total: number; libres: number; ocupados: number; bloqueados: number };
}

export interface Reserva {
  id: number;
  codigo: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA';
  inicio: string;
  fin: string;
  cancelable: boolean;
  reintegroSiCancela: { porcentaje: number; monto: number | null } | null;
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
}

export interface RespuestaLogin {
  token?: string;
  usuario?: Usuario;
  segundoFactorRequerido?: boolean;
  desafio?: string;
  altaSegundoFactor?: { secreto: string; uri: string };
}

interface Pedido {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  token?: string;
  idempotente?: boolean;
}

/** Thin client over the API, with the shapes the suite needs. */
export class Api {
  private constructor(private readonly ctx: APIRequestContext, readonly token: string) {}

  static async nuevo(contexto: APIRequestContext): Promise<APIRequestContext> {
    return contexto;
  }

  static async contexto(): Promise<APIRequestContext> {
    // No baseURL: Playwright resolves a leading "/" against the host and would drop the /api prefix.
    return request.newContext();
  }

  static login(ctx: APIRequestContext, email: string, password: string): Promise<RespuestaLogin> {
    return new Api(ctx, '').pedir<RespuestaLogin>({ method: 'POST', path: '/auth/login', body: { email, password } });
  }

  static segundoFactor(ctx: APIRequestContext, desafio: string, codigo: string): Promise<RespuestaLogin> {
    return new Api(ctx, '').pedir<RespuestaLogin>({
      method: 'POST',
      path: '/auth/login/segundo-factor',
      body: { desafio, codigo },
    });
  }

  /** A client already signed in with `token`. */
  static conToken(ctx: APIRequestContext, token: string): Api {
    return new Api(ctx, token);
  }

  private async pedir<T>({ method, path, body, token, idempotente }: Pedido): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const autorizacion = token ?? this.token;
    if (autorizacion) headers.Authorization = `Bearer ${autorizacion}`;
    if (idempotente) headers['Idempotency-Key'] = `e2e-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    const respuesta = await this.ctx.fetch(`${API_URL}${path}`, {
      method,
      headers,
      data: body === undefined ? undefined : JSON.stringify(body),
      failOnStatusCode: false,
    });
    const texto = await respuesta.text();
    const datos = texto ? (JSON.parse(texto) as T) : (undefined as T);
    if (!respuesta.ok()) {
      throw new Error(`${method} ${path} respondió ${respuesta.status()}: ${texto || '(sin cuerpo)'}`);
    }
    return datos;
  }

  // --- Perfil y medios de pago -------------------------------------------------------------

  perfil(): Promise<Usuario> {
    return this.pedir({ method: 'GET', path: '/usuarios/me' });
  }

  mediosPago(): Promise<MedioPago[]> {
    return this.pedir({ method: 'GET', path: '/usuarios/me/medios-pago' });
  }

  agregarMedioPago(titular: string): Promise<MedioPago> {
    return this.pedir({
      method: 'POST',
      path: '/usuarios/me/medios-pago',
      idempotente: true,
      body: {
        titular,
        numeroTarjeta: '4111 1111 1111 1111',
        vencimiento: '12/32',
        codigoSeguridad: '123',
      },
    });
  }

  // --- Catálogo ---------------------------------------------------------------------------

  edificios(): Promise<EdificioConPisos[]> {
    return this.pedir({ method: 'GET', path: '/edificios' });
  }

  plano(pisoId: number, filtro: { fecha: string; desde: string; hasta: string }): Promise<Plano> {
    const query = new URLSearchParams(filtro).toString();
    return this.pedir({ method: 'GET', path: `/pisos/${pisoId}/plano?${query}` });
  }

  espaciosDePiso(pisoId: number): Promise<EspacioPlano[]> {
    return this.pedir({ method: 'GET', path: `/pisos/${pisoId}/espacios` });
  }

  /**
   * A floor with a free space in a two-hour window, beyond the two weeks of demo bookings so the
   * whole day is free and the test never races the seeded data. The window is computed inside
   * each building's opening hours.
   */
  async espacioLibre(fecha: string, indiceVentana = 0): Promise<{
    pisoId: number; espacioId: number; codigo: string; apertura: string; cierre: string; desde: string; hasta: string;
  }> {
    for (const edificio of await this.edificios()) {
      const ventana = this.ventana(edificio.apertura, edificio.cierre, indiceVentana);
      for (const piso of edificio.pisos) {
        const plano = await this.plano(piso.id, { fecha, ...ventana });
        const libre = plano.espacios.find((e) => e.estado === 'LIBRE' && e.cumpleFiltros);
        if (libre) {
          return {
            pisoId: piso.id,
            espacioId: libre.id,
            codigo: libre.codigo,
            apertura: edificio.apertura,
            cierre: edificio.cierre,
            ...ventana,
          };
        }
      }
    }
    throw new Error(`Ningún piso tiene un espacio libre el ${fecha}.`);
  }

  /** A floor of the catalog, for the screens that do not need a free space (agenda). */
  async primerPiso(): Promise<{ pisoId: number; apertura: string; cierre: string }> {
    const edificio = (await this.edificios()).find((e) => e.pisos.length > 0);
    if (!edificio) throw new Error('El catálogo no tiene ningún piso.');
    return { pisoId: edificio.pisos[0].id, apertura: edificio.apertura, cierre: edificio.cierre };
  }

  /** A two-hour window inside the building's opening hours. */
  ventana(apertura: string, cierre: string, indice = 0): { desde: string; hasta: string } {
    const candidatos: string[] = [];
    for (let minuto = minutos(apertura); minuto + 120 <= minutos(cierre); minuto += 30) candidatos.push(hhmm(minuto));
    const desde = candidatos[Math.min(Math.abs(indice), candidatos.length - 1)];
    return { desde, hasta: hhmm(minutos(desde) + 120) };
  }

  // --- Reservas del cliente ---------------------------------------------------------------

  crearReserva(espacioId: number, inicio: string, fin: string, medioPagoId: number): Promise<Reserva> {
    return this.pedir({
      method: 'POST',
      path: '/reservas',
      idempotente: true,
      body: { espacioId, inicio, fin, medioPagoId },
    });
  }

  reserva(id: number): Promise<Reserva> {
    return this.pedir({ method: 'GET', path: `/reservas/${id}` });
  }

  cancelarReserva(id: number): Promise<Reserva> {
    return this.pedir({ method: 'PATCH', path: `/reservas/${id}/cancelar` });
  }

  /** Polls until the asynchronous charge leaves the booking in one of the given states. */
  async esperarEstado(id: number, estados: Reserva['estado'][], timeoutMs = 30_000): Promise<Reserva> {
    const limite = Date.now() + timeoutMs;
    let ultima = await this.reserva(id);
    while (!estados.includes(ultima.estado)) {
      if (Date.now() > limite) {
        throw new Error(`La reserva ${ultima.codigo} quedó en ${ultima.estado}: se esperaba ${estados.join(' o ')}.`);
      }
      await new Promise((listo) => setTimeout(listo, 500));
      ultima = await this.reserva(id);
    }
    return ultima;
  }

  // --- Administración ---------------------------------------------------------------------

  clientes(q: string): Promise<Cliente[]> {
    return this.pedir({ method: 'GET', path: `/admin/clientes?q=${encodeURIComponent(q)}` });
  }

  crearReservaAdmin(
    usuarioId: number,
    espacioId: number,
    inicio: string,
    fin: string,
    estado: Reserva['estado'] = 'CONFIRMADA',
  ): Promise<Reserva> {
    return this.pedir({
      method: 'POST',
      path: '/admin/reservas',
      idempotente: true,
      body: { usuarioId, espacioId, inicio, fin, estado },
    });
  }

  crearBloqueo(datos: {
    espacioId: number; inicio: string; fin: string; motivo: string; detalle: string;
  }): Promise<{ grupo: string; cantidad: number }> {
    return this.pedir({
      method: 'POST',
      path: '/admin/bloqueos',
      body: { alcance: 'ESPACIO', ...datos },
    });
  }

  agenda(pisoId: number, fecha: string): Promise<{ espacios: { id: number; codigo: string }[] }> {
    return this.pedir({ method: 'GET', path: `/admin/agenda?pisoId=${pisoId}&fecha=${fecha}` });
  }

  async cerrar(): Promise<void> {
    await this.ctx.dispose();
  }
}
