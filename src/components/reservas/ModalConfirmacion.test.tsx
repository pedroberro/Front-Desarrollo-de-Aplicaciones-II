import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reservasApi } from '../../api/reservasApi';
import { usuariosApi } from '../../api/usuariosApi';
import type { MedioPagoResumen } from '../../types';
import type { Condiciones, EspacioEnPlano, Franja, Reserva } from '../../types/reservas';
import { FranjaTomadaModal, ModalConfirmacion } from './ModalConfirmacion';

// The booking flow against a fake API: what the screen sends and how it reacts to each answer.
vi.mock('../../api/reservasApi', () => ({ reservasApi: { crear: vi.fn(), mias: vi.fn() } }));
vi.mock('../../api/usuariosApi', () => ({ usuariosApi: { listarMediosPago: vi.fn() } }));

const crear = vi.mocked(reservasApi.crear);
const mias = vi.mocked(reservasApi.mias);
const listarMediosPago = vi.mocked(usuariosApi.listarMediosPago);

const espacio: EspacioEnPlano = {
  id: 7,
  codigo: 'P3-12',
  tipo: 'SALA_REUNIONES',
  tipoEtiqueta: 'Sala de reuniones',
  capacidad: 6,
  ventana: true,
  orientacion: 'Norte',
  precioHora: 8000,
  equipamiento: [],
  posicion: { x: 0, y: 0, ancho: 1, alto: 1 },
  estado: 'LIBRE',
  ocupacion: null,
  proximoLibre: null,
  cumpleFiltros: true,
};

const franja: Franja = { inicio: '2026-12-01T10:00:00', fin: '2026-12-01T12:00:00' };

const condiciones: Condiciones = {
  pasoMinutos: 30,
  minimaMinutos: 30,
  maximaMinutos: 480,
  anticipacionMaximaDias: 60,
  cancelacionSinCargoHoras: 48,
  cancelacionConRetencionHoras: 24,
  reintegroParcialPorcentaje: 50,
};

function tarjeta(id: number, ultimos4: string, principal: boolean): MedioPagoResumen {
  return {
    id, ultimos4, principal,
    tipo: 'TARJETA', descripcion: 'Visa', titular: 'Ana Pérez', vencimiento: '12/29', verificado: true, estado: 'ACTIVO',
  };
}

function reserva(estado: Reserva['estado'], inicio: string, fin: string): Reserva {
  return {
    id: 40, codigo: 'R-0040', estado, inicio, fin, duracionMinutos: 60,
    espacio: { id: 9, codigo: 'P3-04', tipo: 'CUBICULO', tipoEtiqueta: 'Cubículo', capacidad: 1 },
    piso: { id: 3, nombre: 'Piso 3' }, edificio: { id: 1, nombre: 'Torre Norte' }, empresa: { id: 1, nombre: 'Acme' },
    cliente: { id: 5, nombre: 'Ana Pérez', email: 'ana@example.com' },
    creadaPorAdmin: false, cancelable: true, creadaEl: '2026-11-20T09:00:00', cambios: null, pago: null, reintegroSiCancela: null,
  };
}

/** An error answer of the API, as axios rejects it. */
function errorApi(status: number, data: unknown): AxiosError {
  const headers = new AxiosHeaders();
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined,
    { status, statusText: '', data, headers, config: { headers } });
}

function abrirModal() {
  const onCreada = vi.fn();
  const onTomada = vi.fn();
  render(
    <MemoryRouter>
      <ModalConfirmacion espacio={espacio} edificio="Torre Norte" piso="Piso 3" franja={franja} condiciones={condiciones}
        onCerrar={vi.fn()} onCreada={onCreada} onTomada={onTomada} />
    </MemoryRouter>,
  );
  return { onCreada, onTomada, confirmar: () => screen.getByRole('button', { name: 'Confirmar reserva' }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  listarMediosPago.mockResolvedValue([tarjeta(1, '1111', false), tarjeta(2, '4242', true)]);
  mias.mockResolvedValue({ proximas: [], historial: [] });
});

describe('Confirmar una reserva', () => {
  it('muestra el resumen con el total y reserva con la tarjeta principal', async () => {
    const creada = reserva('PENDIENTE', franja.inicio, franja.fin);
    crear.mockResolvedValue(creada);
    const { onCreada, confirmar } = abrirModal();

    expect(screen.getByText(/P3-12 · Sala de reuniones · 6 personas/)).toBeInTheDocument();
    expect(screen.getByText('2 h')).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: 'Método de pago' })).toHaveDisplayValue(/4242/);

    await waitFor(() => expect(confirmar()).toBeEnabled());
    await userEvent.click(confirmar());

    expect(crear).toHaveBeenCalledWith(7, franja.inicio, franja.fin, 2);
    expect(onCreada).toHaveBeenCalledWith(creada);
  });

  it('reserva con la tarjeta que elige la persona', async () => {
    crear.mockResolvedValue(reserva('PENDIENTE', franja.inicio, franja.fin));
    const { confirmar } = abrirModal();

    await userEvent.selectOptions(await screen.findByRole('combobox', { name: 'Método de pago' }), '1');
    await waitFor(() => expect(confirmar()).toBeEnabled());
    await userEvent.click(confirmar());

    expect(crear).toHaveBeenCalledWith(7, franja.inicio, franja.fin, 1);
  });

  it('si la franja se ocupó mientras confirmaba, pasa las alternativas sin mostrar un error', async () => {
    const tomada = {
      message: 'Esa franja ya no está disponible', code: 'FRANJA_OCUPADA',
      alternativas: [{ inicio: '2026-12-01T12:00:00', fin: '2026-12-01T14:00:00' }],
    };
    crear.mockRejectedValue(errorApi(409, tomada));
    const { onTomada, onCreada, confirmar } = abrirModal();

    await waitFor(() => expect(confirmar()).toBeEnabled());
    await userEvent.click(confirmar());

    expect(onTomada).toHaveBeenCalledWith(tomada);
    expect(onCreada).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ante otro error muestra el mensaje de la API y deja reintentar', async () => {
    crear.mockRejectedValue(errorApi(400, { message: 'La reserva no puede empezar en el pasado', code: null }));
    const { onCreada, confirmar } = abrirModal();

    await waitFor(() => expect(confirmar()).toBeEnabled());
    await userEvent.click(confirmar());

    expect(await screen.findByRole('alert')).toHaveTextContent('La reserva no puede empezar en el pasado');
    expect(confirmar()).toBeEnabled();
    expect(onCreada).not.toHaveBeenCalled();
  });

  it('no deja reservar si la persona ya tiene otro espacio en ese horario', async () => {
    mias.mockResolvedValue({ proximas: [reserva('CONFIRMADA', '2026-12-01T11:00:00', '2026-12-01T13:00:00')], historial: [] });
    const { confirmar } = abrirModal();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Ya tenés la reserva R-0040 en P3-04/);
    expect(confirmar()).toBeDisabled();
  });

  it('una reserva cancelada o que termina justo al empezar la franja no choca', async () => {
    mias.mockResolvedValue({
      proximas: [
        reserva('CANCELADA', '2026-12-01T10:00:00', '2026-12-01T12:00:00'),
        reserva('CONFIRMADA', '2026-12-01T08:00:00', '2026-12-01T10:00:00'),
      ],
      historial: [],
    });
    const { confirmar } = abrirModal();

    await waitFor(() => expect(confirmar()).toBeEnabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sin tarjetas guardadas pide agregar una y no deja confirmar', async () => {
    listarMediosPago.mockResolvedValue([]);
    const { confirmar } = abrirModal();

    expect(await screen.findByRole('status')).toHaveTextContent('Para reservar necesitás un método de pago');
    expect(confirmar()).toBeDisabled();
  });
});

describe('Franja tomada', () => {
  it('ofrece los horarios libres más cercanos y elige uno', async () => {
    const onElegir = vi.fn();
    const alternativa = { inicio: '2026-12-01T12:00:00', fin: '2026-12-01T14:00:00' };
    render(
      <FranjaTomadaModal codigo="P3-12" franja={franja}
        body={{ message: 'Ocupada', code: 'FRANJA_OCUPADA', alternativas: [alternativa] }}
        onElegir={onElegir} onOtroEspacio={vi.fn()} onActualizar={vi.fn()} />,
    );

    expect(screen.getByText(/Tu reserva no se creó/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /12:00/ }));

    expect(onElegir).toHaveBeenCalledWith(alternativa);
  });

  it('sin alternativas lo dice', () => {
    render(
      <FranjaTomadaModal codigo="P3-12" franja={franja} body={{ message: 'Ocupada', code: 'FRANJA_OCUPADA', alternativas: [] }}
        onElegir={vi.fn()} onOtroEspacio={vi.fn()} onActualizar={vi.fn()} />,
    );

    expect(screen.getByText('No quedan horarios libres de ese largo en P3-12 ese día.')).toBeInTheDocument();
  });
});
