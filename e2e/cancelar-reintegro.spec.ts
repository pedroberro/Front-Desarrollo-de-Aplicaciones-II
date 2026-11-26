import { expect, test } from './fixtures';
import { diaDeLaCorrida, ventanaAlAzar } from './escenario';
import { patronDiaMes } from './fechas';
import { entrarComoCliente } from './helpers';

// Caso manual: "el cliente cancela una reserva confirmada y ve el reintegro".
test('el cliente cancela con reintegro y la reserva pasa al historial', async ({ page, api, creds }) => {
  const fecha = diaDeLaCorrida();
  const espacio = await api.espacioLibre(fecha, ventanaAlAzar());

  // A confirmed booking, created through the API: cancelling it is what the screen is about.
  const reserva = await api.crearReserva(
    espacio.espacioId,
    `${fecha}T${espacio.desde}:00`,
    `${fecha}T${espacio.hasta}:00`,
    creds.demo.medioPagoId,
  );
  const confirmada = await api.esperarEstado(reserva.id, ['CONFIRMADA']);

  await entrarComoCliente(page, creds);
  await page.goto('/mis-reservas');

  // The row does not show the reservation code, so it is found by date, space and slot.
  const fila = page
    .getByRole('listitem')
    .filter({ hasText: patronDiaMes(fecha) })
    .filter({ hasText: espacio.codigo })
    .filter({ hasText: `${espacio.desde} – ${espacio.hasta}` });
  await expect(fila).toHaveCount(1);
  await expect(fila.getByText('Confirmada')).toBeVisible();
  await fila.getByRole('button', { name: 'Cancelar' }).click();

  const dialogo = page.getByRole('dialog', { name: `Cancelar la reserva ${confirmada.codigo}` });
  await expect(dialogo).toBeVisible();
  // More than the free-cancellation window, so the whole charge comes back.
  await expect(dialogo.getByText(/Te devolvemos el total/)).toBeVisible();
  await dialogo.getByRole('button', { name: 'Cancelar reserva' }).click();

  await expect(page.getByRole('status').first()).toContainText(`Cancelaste la reserva ${confirmada.codigo}`);
  await expect(fila).toHaveCount(0);

  await page.getByRole('tab', { name: /Historial/ }).click();
  const enHistorial = page
    .getByRole('listitem')
    .filter({ hasText: patronDiaMes(fecha) })
    .filter({ hasText: espacio.codigo })
    .filter({ hasText: `${espacio.desde} – ${espacio.hasta}` });
  await expect(enHistorial).toContainText('Cancelada');

  const cancelada = await api.reserva(confirmada.id);
  expect(cancelada.estado).toBe('CANCELADA');
});
