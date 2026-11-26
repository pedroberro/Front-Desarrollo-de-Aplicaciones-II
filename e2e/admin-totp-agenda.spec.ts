import { expect, test } from './fixtures';
import { entrarComoAdmin } from './helpers';

// Caso manual: "el administrador entra con contraseña y código TOTP y ve la agenda del día".
test('el administrador entra con TOTP y ve la agenda', async ({ page, apiAdmin, creds }) => {
  await entrarComoAdmin(page, creds);

  await expect(page).toHaveURL(/\/admin\/agenda/);
  await expect(page.getByRole('heading', { name: 'Agenda del día' })).toBeVisible();

  const agenda = page.getByRole('region', { name: 'Agenda' });
  await expect(agenda).toBeVisible();
  await expect(agenda.locator('.agenda-head').first()).toBeAttached();

  // The grid shows the real spaces of the floor the administrator landed on.
  const { pisoId } = await apiAdmin.primerPiso();
  const delDia = await apiAdmin.agenda(pisoId, new Date().toISOString().slice(0, 10));
  const primero = delDia.espacios[0];
  expect(primero).toBeTruthy();
  await page.goto(`/admin/agenda?piso=${pisoId}`);
  await expect(agenda.getByText(primero.codigo, { exact: true }).first()).toBeVisible();
});
