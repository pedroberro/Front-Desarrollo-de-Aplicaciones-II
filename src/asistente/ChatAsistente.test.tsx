import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ChatAsistente } from './ChatAsistente';
import { buscarPregunta } from './catalogo';

function abrirAsistente() {
  render(
    <MemoryRouter>
      <ChatAsistente />
    </MemoryRouter>,
  );
  return userEvent.setup({ delay: null });
}

describe('Asistente de ayuda', () => {
  it('abre la ventana desde el botón flotante y agrupa las preguntas por categoría', async () => {
    const user = abrirAsistente();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abrir el asistente' }));

    expect(screen.getByRole('dialog', { name: 'Asistente de Planta Libre' })).toBeInTheDocument();
    expect(screen.getByText(/Soy el asistente de Planta Libre/, { selector: '.chat-msg-bot' })).toBeInTheDocument();
    for (const categoria of ['Reservas', 'Pagos', 'Cancelaciones', 'Mi cuenta']) {
      expect(screen.getByRole('button', { name: categoria })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: '¿Cómo realizo mi reserva?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pagos' }));

    expect(screen.getByRole('button', { name: '¿Puedo tener más de un método de pago?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '¿Cómo realizo mi reserva?' })).not.toBeInTheDocument();
  });

  it('responde la pregunta elegida como si la estuviera escribiendo', async () => {
    const user = abrirAsistente();
    await user.click(screen.getByRole('button', { name: 'Abrir el asistente' }));
    await user.click(screen.getByRole('button', { name: 'Pagos' }));

    await user.click(screen.getByRole('button', { name: '¿Puedo tener más de un método de pago?' }));

    expect(screen.getByText('¿Puedo tener más de un método de pago?', { selector: '.chat-msg-user' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'El asistente está escribiendo una respuesta' })).toBeInTheDocument();
    expect(await screen.findByText(/hasta 3 tarjetas de crédito o débito/, {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('entiende la pregunta escrita y avisa cuando no tiene la respuesta', async () => {
    const user = abrirAsistente();
    await user.click(screen.getByRole('button', { name: 'Abrir el asistente' }));
    const campo = screen.getByRole('textbox', { name: 'Escribí tu pregunta' });

    await user.type(campo, 'como cancelo una reserva{Enter}');

    expect(await screen.findByText(/pestaña Próximas/, {}, { timeout: 5000 })).toBeInTheDocument();
    // El enlace de la respuesta aparece recién cuando termina de "escribirla".
    expect(await screen.findByRole('link', { name: 'Ver mis reservas' }, { timeout: 8000 })).toBeInTheDocument();

    await user.type(campo, 'tenés wifi para invitados{Enter}');

    expect(await screen.findByText(/no tengo una respuesta cargada/, {}, { timeout: 5000 })).toBeInTheDocument();
  }, 20000);
});

describe('Búsqueda de preguntas del asistente', () => {
  it('encuentra la respuesta por sinónimos y no inventa coincidencias', () => {
    expect(buscarPregunta('necesito una tarjeta')?.id).toBe('pago-necesito');
    expect(buscarPregunta('¿cómo hago para reservar?')?.id).toBe('reserva-como');
    expect(buscarPregunta('puedo tener varias tarjetas')?.id).toBe('pago-varios');
    expect(buscarPregunta('cuanto sale reservar')?.id).toBe('reserva-precio');
    expect(buscarPregunta('teléfono')).toBeTruthy();
    expect(buscarPregunta('wifi')).toBeNull();
  });
});
