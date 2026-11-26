import { expect, type Page } from '@playwright/test';
import { generateSync } from 'otplib';
import { codigoTotp, reiniciarSegundoFactor } from './admin';
import { recordarSecretoTotp, type Credenciales } from './credenciales';

export async function entrarComoCliente(page: Page, creds: Credenciales): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(creds.demo.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(creds.demo.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/empresas/);
}

/**
 * Administrator sign-in: password, then the 6-digit code of the authenticator app. The second
 * factor is cleared first, so this run always exercises the step the real user sees.
 */
export async function entrarComoAdmin(page: Page, creds: Credenciales): Promise<void> {
  const reiniciado = reiniciarSegundoFactor(creds.admin.email);

  await page.goto('/login');
  await page.getByLabel('Email').fill(creds.admin.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(creds.admin.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page.getByText('Verificación en dos pasos')).toBeVisible();

  // On enrolment the app shows the secret to add to the authenticator app: that is the one to use.
  const secretoVisible = reiniciado ? (await page.locator('code').first().textContent())?.replace(/\s+/g, '') : null;
  const secreto = secretoVisible || creds.admin.totpSecret;
  expect(secreto).toBeTruthy();
  if (secretoVisible) recordarSecretoTotp(creds, secreto);

  const codigo = reiniciado ? generateSync({ secret: secreto }) : await codigoTotp(secreto);
  await page.getByLabel('Código de 6 dígitos').fill(codigo);
  await page.getByRole('button', { name: 'Verificar e ingresar' }).click();

  await expect(page.getByRole('heading', { name: 'Agenda del día' })).toBeVisible();
}

/** Opens a session without going through the form, for the accessibility audits. */
export async function sesionEnNavegador(page: Page, token: string, usuario: unknown): Promise<void> {
  await page.addInitScript(
    ([tokenGuardado, usuarioGuardado]) => {
      localStorage.setItem('token', tokenGuardado as string);
      localStorage.setItem('usuario', usuarioGuardado as string);
    },
    [token, JSON.stringify(usuario)] as const,
  );
}
