# sostenibilidad

Cuadro de mandos interactivo para el análisis de escenarios de sostenibilidad. 

## Requisitos

- Node.js 20+
- npm

## Variables de entorno

| Variable | Descripción |
|---|---|
| `JWT_SECRET` | Secreto para firmar tokens JWT (solo necesario en producción) |
| `DATABASE_PATH` | Ruta de la base de datos SQLite (opcional) |

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build && npm start
```

El usuario por defecto se crea al iniciar:
- **Email:** `admin@sostenibilidad.com`
- **Contraseña:** `sostenibilidad2026`

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm start` | Iniciar servidor en producción |
| `npm run lint` | Verificar código con ESLint |
| `npm run typecheck` | Verificar tipos con TypeScript |

## Despliegue en Vercel

La app está configurada para Vercel con `output: "standalone"`. La base de datos SQLite se crea en `/tmp` (efímero — los datos no persisten entre despliegues).

Para datos persistentes, configura una base de datos externa (ej. Turso, Neon) o desplegar en un servidor con sistema de archivos persistente.
