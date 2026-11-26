# Planta Libre — Frontend

Aplicación web de reserva de espacios de trabajo: React 19, TypeScript y Vite.

## Levantar el sistema completo

El sistema entero (base, broker, API y esta aplicación) se levanta con un solo comando desde el
repositorio del backend. Las instrucciones están en su
[README](https://github.com/pedroberro/Back-Desarrollo-de-Aplicaciones-II#levantar-el-sistema-completo).
Este repositorio tiene que estar clonado en la misma carpeta que el backend.

## Desarrollo

Requiere Node 22 y la API corriendo en `http://localhost:8080` (Vite reenvía `/api` hacia ahí).

```bash
npm ci
npm run dev
```

La aplicación queda en http://localhost:5173.

| Comando | Qué hace |
| --- | --- |
| `npm run lint` | Análisis estático con oxlint |
| `npm test` | Pruebas de UI del flujo de reserva (Vitest y Testing Library) |
| `npm run e2e` | Los cinco escenarios end-to-end y la auditoría de accesibilidad con Playwright |
| `npm run a11y` | Capturas, Lighthouse y `docs/Accesibilidad.md` sobre la corrida anterior |
| `npm run build` | Chequeo de tipos y build de producción en `dist/` |

## Pruebas end-to-end

Los escenarios corren contra el sistema completo, no contra mocks: la API, PostgreSQL y RabbitMQ del
[backend](https://github.com/pedroberro/Back-Desarrollo-de-Aplicaciones-II), y este front servido por
nginx como en producción. Con los dos repositorios clonados en la misma carpeta:

```bash
# desde la carpeta del backend
docker compose up -d --build

# desde este repositorio
npm ci
npx playwright install chromium
npm run e2e      # reserva, franja tomada, cancelación, TOTP del admin y bloqueo en el plano
npm run a11y     # axe + Lighthouse + capturas a 360, 768 y 1280 px
```

`npm run e2e` espera a la API, obtiene la contraseña demo desde el contenedor, deja una tarjeta en la
cuenta demo y prepara el segundo factor del administrador (igual que `api-tests/preparar-datos.sh`
del backend). Los escenarios usan días a más de dos semanas, fuera de las reservas de demostración,
y limpian las que dejó una corrida anterior para poder repetirse sobre la misma base.

Variables útiles: `E2E_BASE_URL` (por defecto `http://localhost:8088`), `E2E_API_URL`
(`http://localhost:8080/api`), `E2E_BACK_DIR` (ruta del backend, por defecto
`../Back-Desarrollo-de-Aplicaciones-II`), `E2E_DEMO_PASSWORD`, `E2E_ADMIN_PASSWORD` y
`E2E_ADMIN_TOTP_SECRET` cuando la base no se puede reiniciar.

La evidencia de accesibilidad queda en [docs/Accesibilidad.md](docs/Accesibilidad.md) y en
`docs/evidencia/accesibilidad/`.

El pipeline de CI (`.github/workflows/ci.yml`) corre lint, escaneo de dependencias (OSV-Scanner),
pruebas, build e imagen Docker en cada push y pull request; el job `e2e` clona el backend, lo levanta
con docker compose y corre los escenarios y la evidencia de accesibilidad. Dependabot abre cada
semana los PR de actualización (`.github/dependabot.yml`). En producción la sirve Vercel
(`vercel.json`); en Docker, nginx (`Dockerfile`, `nginx.conf`).
