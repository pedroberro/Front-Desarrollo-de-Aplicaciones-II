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
| `npm run build` | Chequeo de tipos y build de producción en `dist/` |

El pipeline de CI (`.github/workflows/ci.yml`) corre lint, build e imagen Docker en cada push y
pull request. En producción la sirve Vercel (`vercel.json`); en Docker, nginx (`Dockerfile`,
`nginx.conf`).
