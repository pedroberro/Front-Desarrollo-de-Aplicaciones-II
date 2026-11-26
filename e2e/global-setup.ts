import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { hashSync } from 'bcryptjs';
import { generateSync } from 'otplib';
import type { APIRequestContext } from '@playwright/test';
import { API_URL, Api } from './api';
import { guardarCredenciales, type Credenciales } from './credenciales';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@plantalibre.local';
const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL ?? 'ana.ruiz@demo.plantalibre.local';
const BACK_DIR = resolve(process.env.E2E_BACK_DIR ?? '../Back-Desarrollo-de-Aplicaciones-II');
const ESPERA_API_MS = Number(process.env.E2E_API_WAIT_MS ?? 300_000);

function compose(args: string[]): string {
  return execFileSync('docker', ['compose', '-f', join(BACK_DIR, 'docker-compose.yml'), ...args], {
    encoding: 'utf8',
  });
}

function composeSiSePuede(args: string[]): string | null {
  try {
    return compose(args);
  } catch {
    return null;
  }
}

/**
 * The stack generates its secrets on the first run (docker/init/inicializar.sh), so the demo
 * password is read from the container unless the environment already carries it.
 */
function passwordDemo(): string {
  if (process.env.E2E_DEMO_PASSWORD) return process.env.E2E_DEMO_PASSWORD;
  const leido = composeSiSePuede(['exec', '-T', 'back', 'cat', '/secretos/demo_password'])?.trim();
  if (leido) return leido;
  throw new Error(
    'No encontré la contraseña de las cuentas demo. Levantá el backend con docker compose ' +
      `(E2E_BACK_DIR=${BACK_DIR}) o definí E2E_DEMO_PASSWORD.`,
  );
}

const sql = (valor: string): string => `'${valor.replace(/'/g, "''")}'`;

/**
 * Same preparation the backend's api-tests/preparar-datos.sh does: a password known only by this
 * run and the second factor cleared, so the admin enrols it again in this run.
 */
function reiniciarAdministrador(password: string): boolean {
  const hash = hashSync(password, 12);
  const salida = composeSiSePuede([
    'exec', '-T', 'postgres', 'psql', '-U', 'postgres', '-d', 'reservas_espacios', '-c',
    `UPDATE usuarios SET password = ${sql(hash)}, segundo_factor_activo = FALSE, ` +
      `segundo_factor_secreto = NULL, segundo_factor_ultimo_paso = NULL, password_changed_at = NOW() ` +
      `WHERE email = ${sql(ADMIN_EMAIL)};`,
  ]);
  return salida !== null;
}

/**
 * The demo data only fills the two weeks around today; anything further ahead made by a previous
 * run of this suite would compete for the slots the scenarios use. Removing it keeps the suite
 * repeatable against the same database.
 */
function limpiarCorridaAnterior(): void {
  composeSiSePuede([
    'exec', '-T', 'postgres', 'psql', '-U', 'postgres', '-d', 'reservas_espacios', '-c',
    `DELETE FROM reservas r USING usuarios u
       WHERE u.id = r.usuario_id
         AND u.email LIKE '%@demo.plantalibre.local'
         AND r.inicio > NOW() + INTERVAL '14 days';
     DELETE FROM bloqueos WHERE detalle LIKE 'E2E%';`,
  ]);
}

async function esperarApi(ctx: APIRequestContext): Promise<void> {
  const limite = Date.now() + ESPERA_API_MS;
  let ultimoError = 'sin respuesta';
  while (Date.now() < limite) {
    try {
      const respuesta = await ctx.get(`${API_URL}/health`);
      if (respuesta.ok()) return;
      ultimoError = `HTTP ${respuesta.status()}`;
    } catch (error) {
      ultimoError = (error as Error).message;
    }
    await new Promise((listo) => setTimeout(listo, 2000));
  }
  throw new Error(`La API no respondió en ${API_URL}/health: ${ultimoError}`);
}

async function completarSegundoFactor(ctx: APIRequestContext, desafio: string, secreto: string): Promise<void> {
  const sesion = await Api.segundoFactor(ctx, desafio, generateSync({ secret: secreto }));
  if (!sesion.token) throw new Error('El código TOTP del administrador no fue aceptado.');
}

export default async function globalSetup(): Promise<void> {
  const ctx = await Api.contexto();
  try {
    await esperarApi(ctx);

    // --- Cliente de demostración: contraseña del stack y una tarjeta para poder reservar -----
    limpiarCorridaAnterior();
    const demoPassword = passwordDemo();
    const demoLogin = await Api.login(ctx, DEMO_EMAIL, demoPassword);
    if (!demoLogin.token || !demoLogin.usuario) {
      throw new Error(`${DEMO_EMAIL} no devolvió una sesión. Revisá E2E_DEMO_EMAIL y la contraseña demo.`);
    }
    const demo = Api.conToken(ctx, demoLogin.token);
    const tarjetas = await demo.mediosPago();
    const medioPagoId = tarjetas[0]?.id ?? (await demo.agregarMedioPago(demoLogin.usuario.nombre)).id;

    // --- Administrador: contraseña de esta corrida y segundo factor de esta corrida ----------
    let passwordAdmin = process.env.E2E_ADMIN_PASSWORD;
    let secretoTotp = process.env.E2E_ADMIN_TOTP_SECRET;

    if (!passwordAdmin) {
      const candidata = `E2E-${Date.now().toString(36)}-Aa1!`;
      if (!reiniciarAdministrador(candidata)) {
        throw new Error(
          'No pude reiniciar la contraseña del administrador (¿está docker compose levantado?). ' +
            `Definí E2E_ADMIN_PASSWORD con la contraseña de ${ADMIN_EMAIL} o levantá el stack con E2E_BACK_DIR=${BACK_DIR}.`,
        );
      }
      passwordAdmin = candidata;
    }

    const desafio = await Api.login(ctx, ADMIN_EMAIL, passwordAdmin);
    if (!desafio.segundoFactorRequerido || !desafio.desafio) {
      throw new Error(`${ADMIN_EMAIL} entró sin pedir el segundo factor: la cuenta no está configurada como administrador.`);
    }
    if (desafio.altaSegundoFactor) {
      secretoTotp = desafio.altaSegundoFactor.secreto;
    } else if (!secretoTotp) {
      throw new Error(
        'El administrador ya tiene el segundo factor activo y no sé el secreto. Borrá la base ' +
          '(docker compose down -v) para que esta corrida lo vuelva a enrolar, o pasá E2E_ADMIN_TOTP_SECRET.',
      );
    }
    const secreto = secretoTotp;
    await completarSegundoFactor(ctx, desafio.desafio, secreto);

    const credenciales: Credenciales = {
      demo: { id: demoLogin.usuario.id, email: DEMO_EMAIL, password: demoPassword, medioPagoId },
      admin: { email: ADMIN_EMAIL, password: passwordAdmin, totpSecret: secreto },
    };
    guardarCredenciales(credenciales);
  } finally {
    await ctx.dispose();
  }
}
