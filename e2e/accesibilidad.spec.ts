import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { diaDeLaCorrida, ventanaAlAzar } from './escenario';
import { sesionEnNavegador } from './helpers';
import type { Usuario } from './api';

const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** Runs axe and leaves the whole report attached to the run, failing on critical or serious issues. */
async function auditar(page: Page, pantalla: string): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(ETIQUETAS).analyze();
  const graves = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  await test.info().attach(`axe-${pantalla}.json`, {
    body: JSON.stringify(violations, null, 2),
    contentType: 'application/json',
  });
  expect(
    graves.map((v) => `${v.impact} · ${v.id}: ${v.nodes.length} nodo(s) · ${v.help}`),
    `La pantalla ${pantalla} tiene violaciones graves de accesibilidad`,
  ).toEqual([]);
}

test.describe('Accesibilidad (axe-core)', () => {
  test('login sin sesión', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Planta Libre' })).toBeVisible();
    await auditar(page, 'login');
  });

  test('empresas', async ({ page, api }) => {
    const usuario = await api.perfil();
    await sesionEnNavegador(page, api.token, usuario);
    await page.goto('/empresas');
    await expect(page.getByRole('heading', { name: 'Empresas', level: 1 })).toBeVisible();
    await auditar(page, 'empresas');
  });

  test('plano de un piso', async ({ page, api }) => {
    const usuario = await api.perfil();
    const fecha = diaDeLaCorrida();
    const espacio = await api.espacioLibre(fecha, ventanaAlAzar());
    await sesionEnNavegador(page, api.token, usuario);
    await page.goto(
      `/pisos/${espacio.pisoId}?fecha=${fecha}&desde=${espacio.desde}&hasta=${espacio.hasta}&espacio=${espacio.espacioId}`,
    );
    await expect(page.getByRole('complementary', { name: `Calendario de ${espacio.codigo}` })).toBeVisible();
    await auditar(page, 'plano');
  });

  test('mis reservas', async ({ page, api }) => {
    const usuario = await api.perfil();
    await sesionEnNavegador(page, api.token, usuario);
    await page.goto('/mis-reservas');
    await expect(page.getByRole('heading', { name: 'Mis reservas' })).toBeVisible();
    await auditar(page, 'mis-reservas');
  });

  test('agenda del administrador', async ({ page, apiAdmin }) => {
    const usuario = (await apiAdmin.perfil()) as Usuario;
    const { pisoId } = await apiAdmin.primerPiso();
    await sesionEnNavegador(page, apiAdmin.token, usuario);
    await page.goto(`/admin/agenda?piso=${pisoId}`);
    await expect(page.getByRole('heading', { name: 'Agenda del día' })).toBeVisible();
    await auditar(page, 'agenda');
  });
});
