import { expect, test } from './fixtures';
import { diaDeLaCorrida, ventanaAlAzar } from './escenario';
import { entrarComoCliente } from './helpers';
import { Api } from './api';

// Caso manual: "otra persona toma la franja mientras confirmo y veo los horarios libres cercanos".
test('una franja tomada ofrece alternativas en vez de crear la reserva', async ({ page, api, creds }) => {
  const fecha = diaDeLaCorrida();
  const espacio = await api.espacioLibre(fecha, ventanaAlAzar());
  const inicio = `${fecha}T${espacio.desde}:00`;
  const fin = `${fecha}T${espacio.hasta}:00`;

  // The customer opens the plan and the summary while the slot is still free.
  await entrarComoCliente(page, creds);
  await page.goto(
    `/pisos/${espacio.pisoId}?fecha=${fecha}&desde=${espacio.desde}&hasta=${espacio.hasta}&espacio=${espacio.espacioId}`,
  );
  const panel = page.getByRole('complementary', { name: `Calendario de ${espacio.codigo}` });
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Reservar' }).click();

  const confirmacion = page.getByRole('dialog', { name: 'Confirmar reserva' });
  await expect(confirmacion.getByLabel('Método de pago')).toBeVisible();

  // Another customer books the same slot in between: every demo account shares the run's password.
  const contexto = await Api.contexto();
  try {
    const otra = await Api.login(contexto, 'diego.sosa@demo.plantalibre.local', creds.demo.password);
    expect(otra.token).toBeTruthy();
    const otroCliente = Api.conToken(contexto, otra.token!);
    const tarjetas = await otroCliente.mediosPago();
    const medioPagoId = tarjetas[0]?.id ?? (await otroCliente.agregarMedioPago('Diego Sosa')).id;
    const ajena = await otroCliente.crearReserva(espacio.espacioId, inicio, fin, medioPagoId);
    await otroCliente.esperarEstado(ajena.id, ['CONFIRMADA']);
  } finally {
    await contexto.dispose();
  }

  const esperaRespuesta = page.waitForResponse(
    (r) => new URL(r.url()).pathname === '/api/reservas' && r.request().method() === 'POST',
  );
  await confirmacion.getByRole('button', { name: 'Confirmar reserva' }).click();
  const recibida = await esperaRespuesta;
  expect(recibida.status(), await recibida.text()).toBe(409);

  const tomada = page.getByRole('dialog', { name: 'Esa franja ya no está disponible' });
  await expect(tomada).toBeVisible();
  await expect(tomada.getByText(/Tu reserva no se creó/)).toBeVisible();
  await expect(tomada.getByText(espacio.codigo, { exact: false }).first()).toBeVisible();

  // The alternatives the API proposed are offered as one-click chips.
  await expect(tomada.locator('button.chip-ok').first()).toBeVisible();
  await expect(tomada.getByText(/Horarios libres más cercanos/)).toBeVisible();
});
