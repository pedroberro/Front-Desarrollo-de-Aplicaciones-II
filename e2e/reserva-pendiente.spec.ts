import { expect, test } from './fixtures';
import { diaDeLaCorrida, ventanaAlAzar } from './escenario';
import { patronDiaMes } from './fechas';
import { entrarComoCliente } from './helpers';

// Caso manual: "el cliente reserva un espacio y la reserva queda pendiente de cobro".
test('el cliente reserva y ve la reserva PENDIENTE', async ({ page, api, creds }) => {
  const fecha = diaDeLaCorrida();
  const espacio = await api.espacioLibre(fecha, ventanaAlAzar());

  await entrarComoCliente(page, creds);
  await page.goto(
    `/pisos/${espacio.pisoId}?fecha=${fecha}&desde=${espacio.desde}&hasta=${espacio.hasta}&espacio=${espacio.espacioId}`,
  );

  const panel = page.getByRole('complementary', { name: `Calendario de ${espacio.codigo}` });
  await expect(panel).toBeVisible();
  await expect(panel.getByText(`${espacio.desde} – ${espacio.hasta}`).first()).toBeVisible();
  await panel.getByRole('button', { name: 'Reservar' }).click();

  const confirmacion = page.getByRole('dialog', { name: 'Confirmar reserva' });
  await expect(confirmacion).toBeVisible();
  await expect(confirmacion.getByText(espacio.codigo, { exact: false }).first()).toBeVisible();
  await expect(confirmacion.getByLabel('Método de pago')).toBeVisible();

  const esperaRespuesta = page.waitForResponse(
    (r) => new URL(r.url()).pathname === '/api/reservas' && r.request().method() === 'POST',
  );
  await confirmacion.getByRole('button', { name: 'Confirmar reserva' }).click();

  // The API answers PENDIENTE: the charge runs in the background.
  const recibida = await esperaRespuesta;
  const cuerpo = await recibida.text();
  expect(recibida.status(), cuerpo).toBe(201);
  const reserva = JSON.parse(cuerpo) as { codigo: string; estado: string };
  expect(reserva.estado).toBe('PENDIENTE');

  await expect(page).toHaveURL(/\/mis-reservas/);
  await expect(page.getByRole('status').first()).toContainText('Estamos procesando el pago');

  // The row does not show the reservation code, so it is found by date, space and slot.
  const fila = page
    .getByRole('listitem')
    .filter({ hasText: patronDiaMes(fecha) })
    .filter({ hasText: espacio.codigo })
    .filter({ hasText: `${espacio.desde} – ${espacio.hasta}` });
  await expect(fila).toHaveCount(1);
  await expect(fila.getByText('Pendiente')).toBeVisible();
});
