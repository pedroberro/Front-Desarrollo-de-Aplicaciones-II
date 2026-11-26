import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Credentials of this run. global-setup writes them once; the specs only read them. */
export interface Credenciales {
  demo: { id: number; email: string; password: string; medioPagoId: number };
  admin: { email: string; password: string; totpSecret: string };
}

const ARCHIVO = join(process.cwd(), 'e2e', '.auth', 'credenciales.json');

export function guardarCredenciales(credenciales: Credenciales): void {
  mkdirSync(dirname(ARCHIVO), { recursive: true });
  writeFileSync(ARCHIVO, JSON.stringify(credenciales, null, 2));
}

export function leerCredenciales(): Credenciales {
  return JSON.parse(readFileSync(ARCHIVO, 'utf8')) as Credenciales;
}

/** Every fresh enrolment changes the secret: later steps (and `npm run a11y`) need the current one. */
export function recordarSecretoTotp(credenciales: Credenciales, secreto: string): void {
  guardarCredenciales({ ...credenciales, admin: { ...credenciales.admin, totpSecret: secreto } });
}

