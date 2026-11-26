import { expect, test } from './fixtures';
import { diaDeLaCorrida, ventanaAlAzar } from './escenario';
import { entrarComoAdmin } from './helpers';

// Caso manual: "el administrador bloquea un espacio y el plano lo muestra bloqueado para el cliente".
test('el administrador bloquea un espacio y aparece en el plano', async ({ page, api, creds }) => {
  const fecha = diaDeLaCorrida();
  const espacio = await api.espacioLibre(fecha, ventanaAlAzar());

  await entrarComoAdmin(page, creds);
  await page.goto(`/admin/bloqueos/nuevo?piso=${espacio.pisoId}&fecha=${fecha}`);

  await expect(page.locator(`#blq-espacio option[value="${espacio.espacioId}"]`)).toHaveCount(1);
  await page.selectOption('#blq-espacio', String(espacio.espacioId));
  await page.selectOption('#blq-hora-desde', espacio.desde);
  await page.selectOption('#blq-hora-hasta', espacio.hasta);
  await page.locator('#blq-detalle').fill('E2E · bloqueo de prueba');
  await page.getByRole('button', { name: 'Crear bloqueo' }).click();

  await expect(page).toHaveURL(/\/admin\/bloqueos$/);
  await expect(page.getByRole('status').first()).toContainText(`Bloqueaste ${espacio.codigo}`);

  // The floor plan for that slot now shows the space as blocked (the same view the customer gets).
  await page.goto(
    `/admin/pisos/${espacio.pisoId}?fecha=${fecha}&desde=${espacio.desde}&hasta=${espacio.hasta}`,
  );
  const baldosa = page.getByRole('button', { name: new RegExp(`^${espacio.codigo}\\b.*Bloqueado`) });
  await expect(baldosa).toBeVisible();

  // And the API agrees: the plan reports the blocked space for that slot.
  const plano = await api.plano(espacio.pisoId, { fecha, desde: espacio.desde, hasta: espacio.hasta });
  expect(plano.espacios.find((e) => e.id === espacio.espacioId)?.estado).toBe('BLOQUEADO');
});
