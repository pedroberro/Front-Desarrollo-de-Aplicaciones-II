// Evidencia de accesibilidad del front: auditoría con axe-core, Lighthouse en escritorio y capturas
// a 360, 768 y 1280 px de las cinco pantallas pedidas. Escribe docs/Accesibilidad.md.
//
// Requiere el sistema levantado (docker compose up) y las credenciales de la corrida, que deja
// `npx playwright test` en e2e/.auth/credenciales.json. Se ejecuta con `npm run a11y`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { launch as launchChrome } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { generateSync } from 'otplib';

const API = process.env.E2E_API_URL ?? 'http://localhost:8080/api';
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:8088';
const SALIDA = 'docs/evidencia/accesibilidad';
const ANCHOS = [360, 768, 1280];
const UMBRAL_LIGHTHOUSE = 90;
const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

async function pedir(metodo, ruta, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texto = await respuesta.text();
  if (!respuesta.ok) throw new Error(`${metodo} ${ruta} respondió ${respuesta.status}: ${texto}`);
  return texto ? JSON.parse(texto) : undefined;
}

async function sesiones(credenciales) {
  const demo = await pedir('POST', '/auth/login', { body: credenciales.demo });
  const usuarioDemo = await pedir('GET', '/usuarios/me', { token: demo.token });

  // El API no acepta dos veces el mismo código TOTP: se usa uno del siguiente bloque de 30 s.
  const siguienteBloque = (Math.floor(Date.now() / 30_000) + 1) * 30_000;
  await esperar(Math.max(0, siguienteBloque - Date.now()) + 1200);

  const desafio = await pedir('POST', '/auth/login', { body: credenciales.admin });
  const secreto = desafio.altaSegundoFactor?.secreto ?? credenciales.admin.totpSecret;
  if (!desafio.desafio || !secreto) throw new Error('El administrador no pidió el segundo factor.');
  if (desafio.altaSegundoFactor) {
    // The fresh secret is the one the next sign-in will need.
    credenciales.admin.totpSecret = secreto;
    writeFileSync('e2e/.auth/credenciales.json', JSON.stringify(credenciales, null, 2));
  }
  const admin = await pedir('POST', '/auth/login/segundo-factor', {
    body: { desafio: desafio.desafio, codigo: generateSync({ secret: secreto }) },
  });

  return {
    demo: { token: demo.token, usuario: usuarioDemo },
    admin: { token: admin.token, usuario: admin.usuario },
    secretoRenovado: Boolean(desafio.altaSegundoFactor),
  };
}

function fechaHabilFutura(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  while ([0, 6].includes(fecha.getDay())) fecha.setDate(fecha.getDate() + 1);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

async function pantallas(sesion) {
  const edificios = await pedir('GET', '/edificios', { token: sesion.demo.token });
  const edificio = edificios.find((e) => e.pisos.length > 0);
  const pisoId = edificio.pisos[0].id;
  const desde = edificio.apertura;
  const [hora, minuto] = desde.split(':').map(Number);
  const hasta = `${String(hora + 2).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
  const fecha = fechaHabilFutura(21);
  const plano = await pedir('GET', `/pisos/${pisoId}/plano?fecha=${fecha}&desde=${desde}&hasta=${hasta}`, {
    token: sesion.demo.token,
  });
  const libre = plano.espacios.find((e) => e.estado === 'LIBRE');
  const planoQuery = `fecha=${fecha}&desde=${desde}&hasta=${hasta}&vista=plano${libre ? `&espacio=${libre.id}` : ''}`;

  return [
    { id: 'login', nombre: 'Ingreso', ruta: '/login', sesion: null, listo: 'h1' },
    { id: 'empresas', nombre: 'Empresas', ruta: '/empresas', sesion: 'demo', listo: 'h1' },
    { id: 'plano', nombre: 'Plano de un piso', ruta: `/pisos/${pisoId}?${planoQuery}`, sesion: 'demo', listo: '.plano' },
    { id: 'mis-reservas', nombre: 'Mis reservas', ruta: '/mis-reservas', sesion: 'demo', listo: 'h1' },
    { id: 'agenda', nombre: 'Agenda del día', ruta: `/admin/agenda?piso=${pisoId}`, sesion: 'admin', listo: 'h1' },
  ];
}

/** Sets (or clears) the session in the browser profile Lighthouse reuses for the next tab. */
async function fijarSesion(contexto, sesion, tipo) {
  const pagina = await contexto.newPage();
  await pagina.goto(`${BASE}/login`);
  await pagina.evaluate(([actual]) => {
    localStorage.clear();
    if (!actual) return;
    localStorage.setItem('token', actual.token);
    localStorage.setItem('usuario', JSON.stringify(actual.usuario));
  }, [tipo ? sesion[tipo] : null]);
  await pagina.close();
}

async function auditarConAxe(pagina) {
  const { violations } = await new AxeBuilder({ page: pagina }).withTags(ETIQUETAS).analyze();
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodos: v.nodes.length,
    ayuda: v.helpUrl,
  }));
}

async function correrLighthouse(puerto, pantalla) {
  // Performance en un contenedor/local comparte CPU con el resto del sistema: tres corridas y la
  // mediana, para que un pico de carga ajeno no decida el número del informe.
  const intentos = [];
  for (let intento = 0; intento < 3; intento++) {
    const resultado = await lighthouse(`${BASE}${pantalla.ruta}`, {
      port: puerto,
      output: 'json',
      logLevel: 'error',
      formFactor: 'desktop',
      screenEmulation: { mobile: false, width: 1280, height: 900, deviceScaleFactor: 1, disabled: false },
      throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
      throttlingMethod: 'simulate',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });
    intentos.push({
      informe: resultado.report,
      categorias: Object.fromEntries(
        Object.entries(resultado.lhr.categories).map(([clave, valor]) => [
          clave,
          valor.score === null ? null : Math.round(valor.score * 100),
        ]),
      ),
    });
  }

  const mediana = [...intentos].sort((a, b) => a.categorias.performance - b.categorias.performance)[1];
  writeFileSync(join(SALIDA, `lighthouse-${pantalla.id}.json`), mediana.informe);
  return { ...mediana.categorias, intentos: intentos.map((i) => i.categorias.performance) };
}

async function capturar(contexto, pantalla, ancho) {
  const pagina = await contexto.newPage();
  await pagina.setViewportSize({ width: ancho, height: 900 });
  await pagina.goto(`${BASE}${pantalla.ruta}`);
  await pagina.waitForSelector(pantalla.listo, { timeout: 30_000 });
  await pagina.waitForTimeout(700);
  await pagina.screenshot({ path: join(SALIDA, `${ancho}-${pantalla.id}.png`), fullPage: true });
  const axe = ancho === 1280 ? await auditarConAxe(pagina) : null;
  await pagina.close();
  return axe;
}

const icono = (valor) =>
  valor === null || valor === undefined ? '—' : `${valor}${valor >= UMBRAL_LIGHTHOUSE ? ' ✅' : ' ⚠️'}`;

function escribirInforme({ fecha, auditadas, secretoRenovado }) {
  const filasAxe = auditadas
    .map((p) => {
      const graves = (p.axe ?? []).filter((v) => v.impact === 'critical' || v.impact === 'serious');
      const leves = (p.axe ?? []).filter((v) => v.impact !== 'critical' && v.impact !== 'serious');
      return `| ${p.nombre} | ${graves.length === 0 ? 'Ninguna ✅' : graves.map((v) => `\`${v.id}\` (${v.nodos} nodo/s)`).join(', ')} | ${leves.length} |`;
    })
    .join('\n');

  const filasLighthouse = auditadas
    .map((p) => {
      const c = p.lighthouse ?? {};
      return `| ${p.nombre} | ${icono(c.performance)} | ${icono(c.accessibility)} | ${icono(c['best-practices'])} | ${icono(c.seo)} |`;
    })
    .join('\n');

  const minimo = Math.min(...auditadas.map((p) => p.lighthouse?.performance ?? 0));

  const capturas = ANCHOS.map(
    (ancho) =>
      `### ${ancho} px\n\n| Pantalla | Captura |\n| --- | --- |\n` +
      auditadas
        .map((p) => `| ${p.nombre} | ![${p.nombre} a ${ancho} px](evidencia/accesibilidad/${ancho}-${p.id}.png) |`)
        .join('\n') +
      '\n',
  ).join('\n');

  return `# Accesibilidad — Planta Libre (front)

Evidencia de la revisión de accesibilidad del front (React 19 + Vite). Generada por
\`npm run a11y\` el ${fecha} contra ${BASE}, con el sistema completo levantado
(\`docker compose up\`: base, broker, API y front).

## Qué se mide

| Herramienta | Alcance | Criterio |
| --- | --- | --- |
| [axe-core](https://github.com/dequelabs/axe-core) via \`@axe-core/playwright\` | Las cinco pantallas, reglas WCAG 2.1 A y AA | Ninguna violación **crítica** ni **seria** |
| [Lighthouse](https://developer.chrome.com/docs/lighthouse) 13, perfil escritorio | Performance, accesibilidad, buenas prácticas y SEO | **Performance ≥ ${UMBRAL_LIGHTHOUSE}** en las cinco pantallas (mediana de tres corridas) |
| Capturas a 360, 768 y 1280 px | Reflow y lectura en móvil, tablet y escritorio | Sin contenido cortado ni solapado |

La suite de Playwright corre la misma auditoría de axe en cada ejecución
(\`e2e/accesibilidad.spec.ts\`), así que una regresión de accesibilidad rompe el CI.

## Resultados de axe-core

| Pantalla | Violaciones críticas o serias | Avisos leves |
| --- | --- | --- |
${filasAxe}

## Resultados de Lighthouse (escritorio, 1280 px)

| Pantalla | Performance | Accesibilidad | Buenas prácticas | SEO |
| --- | --- | --- | --- | --- |
${filasLighthouse}

${
  minimo >= UMBRAL_LIGHTHOUSE
    ? `**Performance mínima: ${minimo}** ✅ (umbral ${UMBRAL_LIGHTHOUSE}).`
    : `**Performance mínima: ${minimo}** ⚠️ por debajo del umbral ${UMBRAL_LIGHTHOUSE}.`
}

Los reportes completos quedan en \`docs/evidencia/accesibilidad/lighthouse-<pantalla>.json\`.

> La columna de performance es la **mediana de tres corridas** del mismo build; las tres mediciones de
> cada pantalla quedan en \`docs/evidencia/accesibilidad/resumen.json\`. Se usa la mediana porque el
> perfil escritorio de Lighthouse comparte CPU con el resto del sistema y un pico de carga ajeno no
> debe decidir el número.

## Capturas

${capturas}
## Cómo reproducirlo

\`\`\`bash
# 1) Sistema completo (API y front), desde la carpeta del backend
docker compose up -d --build

# 2) Suite end-to-end (incluye la auditoría de axe)
npm run e2e

# 3) Este informe: capturas, Lighthouse y docs/Accesibilidad.md
npm run a11y
\`\`\`

Variables opcionales: \`E2E_BASE_URL\` (por defecto \`http://localhost:8088\`),
\`E2E_API_URL\` (\`http://localhost:8080/api\`) y \`E2E_BACK_DIR\` (ruta del repositorio del backend).
${
  secretoRenovado
    ? '\n> El administrador enroló de nuevo su segundo factor en esta corrida, así que el secreto que\n> muestra la aplicación cambió. La próxima corrida de `npm run e2e` vuelve a prepararlo.\n'
    : ''
}`;
}

async function principal() {
  const credenciales = JSON.parse(readFileSync('e2e/.auth/credenciales.json', 'utf8'));
  mkdirSync(SALIDA, { recursive: true });

  const sesion = await sesiones(credenciales);
  const lista = await pantallas(sesion);

  const chrome = await launchChrome({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });

  try {
    const navegador = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
    const contexto = navegador.contexts()[0];
    const auditadas = [];

    for (const pantalla of lista) {
      await fijarSesion(contexto, sesion, pantalla.sesion);
      const lighthouseDe = await correrLighthouse(chrome.port, pantalla);
      console.log(`Lighthouse ${pantalla.nombre}: performance ${lighthouseDe.performance}`);

      let axe = null;
      for (const ancho of ANCHOS) {
        const resultado = await capturar(contexto, pantalla, ancho);
        if (resultado) axe = resultado;
      }
      auditadas.push({ ...pantalla, axe, lighthouse: lighthouseDe });
    }

    await navegador.close();

    writeFileSync(
      'docs/Accesibilidad.md',
      escribirInforme({
        fecha: new Date().toISOString().slice(0, 10),
        auditadas,
        secretoRenovado: sesion.secretoRenovado,
      }),
    );
    writeFileSync(
      join(SALIDA, 'resumen.json'),
      JSON.stringify({ generado: new Date().toISOString(), auditadas }, null, 2),
    );
    console.log('Informe escrito en docs/Accesibilidad.md');

    const bajo = auditadas.filter((p) => (p.lighthouse?.performance ?? 0) < UMBRAL_LIGHTHOUSE);
    if (bajo.length > 0) {
      console.error(
        `Performance por debajo de ${UMBRAL_LIGHTHOUSE}: ${bajo.map((p) => `${p.nombre} (${p.lighthouse.performance})`).join(', ')}`,
      );
      process.exitCode = 1;
    }
  } finally {
    await chrome.kill();
  }
}

principal().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
