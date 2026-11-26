import { test as base } from '@playwright/test';
import { generateSync } from 'otplib';
import { codigoTotp, reiniciarSegundoFactor } from './admin';
import { Api } from './api';
import { leerCredenciales, recordarSecretoTotp, type Credenciales } from './credenciales';

interface Fixtures {
  /** Credentials of this run, written by global-setup. */
  creds: Credenciales;
  /** API already signed in as the demo customer. */
  api: Api;
  /** API already signed in as the administrator (password + TOTP). */
  apiAdmin: Api;
}

export const test = base.extend<Fixtures>({
  creds: async ({}, use) => {
    await use(leerCredenciales());
  },

  api: async ({ creds }, use) => {
    const ctx = await Api.contexto();
    try {
      const sesion = await Api.login(ctx, creds.demo.email, creds.demo.password);
      if (!sesion.token) throw new Error('La cuenta demo no devolvió una sesión.');
      await use(Api.conToken(ctx, sesion.token));
    } finally {
      await ctx.dispose();
    }
  },

  apiAdmin: async ({ creds }, use) => {
    const ctx = await Api.contexto();
    try {
      const reiniciado = reiniciarSegundoFactor(creds.admin.email);
      const desafio = await Api.login(ctx, creds.admin.email, creds.admin.password);
      if (!desafio.segundoFactorRequerido || !desafio.desafio) {
        throw new Error('El administrador no pidió el segundo factor.');
      }
      const secreto = desafio.altaSegundoFactor?.secreto ?? creds.admin.totpSecret;
      if (desafio.altaSegundoFactor) recordarSecretoTotp(creds, secreto);
      const codigo = reiniciado && desafio.altaSegundoFactor
        ? generateSync({ secret: secreto })
        : await codigoTotp(secreto);
      const sesion = await Api.segundoFactor(ctx, desafio.desafio, codigo);
      if (!sesion.token) throw new Error('El código TOTP del administrador no fue aceptado.');
      await use(Api.conToken(ctx, sesion.token));
    } finally {
      await ctx.dispose();
    }
  },
});

export { expect } from '@playwright/test';
