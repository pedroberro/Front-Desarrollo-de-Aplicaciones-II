import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { generateSync } from 'otplib';

const BACK_DIR = resolve(process.env.E2E_BACK_DIR ?? '../Back-Desarrollo-de-Aplicaciones-II');

function psql(consulta: string): string {
  return execFileSync(
    'docker',
    [
      'compose', '-f', join(BACK_DIR, 'docker-compose.yml'),
      'exec', '-T', 'postgres', 'psql', '-U', 'postgres', '-d', 'reservas_espacios', '-c', consulta,
    ],
    { encoding: 'utf8' },
  );
}

/**
 * Clears the second factor so the next sign-in enrols it again. The API never accepts a code it
 * already used (RFC 6238 replay protection), so every scenario that signs in as the administrator
 * starts from a clean second factor instead of reusing a code from the previous one.
 *
 * Returns false when the stack is not reachable through docker compose (e.g. a deployed API).
 */
export function reiniciarSegundoFactor(email: string): boolean {
  try {
    psql(
      `UPDATE usuarios SET segundo_factor_activo = FALSE, segundo_factor_secreto = NULL, ` +
        `segundo_factor_ultimo_paso = NULL WHERE email = '${email.replace(/'/g, "''")}';`,
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Code for the current 30-second step. When the database cannot be reset, the last step used is
 * tracked on disk so the suite never sends a code the API would reject as a replay.
 */
let ultimoPaso: number | null = null;

export async function codigoTotp(secreto: string): Promise<string> {
  const paso = Math.floor(Date.now() / 30_000);
  if (ultimoPaso !== null && paso <= ultimoPaso) {
    await new Promise((listo) => setTimeout(listo, (ultimoPaso + 1) * 30_000 - Date.now() + 1000));
  }
  ultimoPaso = Math.floor(Date.now() / 30_000);
  return generateSync({ secret: secreto });
}

export function codigoTotpAhora(secreto: string): string {
  ultimoPaso = Math.floor(Date.now() / 30_000);
  return generateSync({ secret: secreto });
}
