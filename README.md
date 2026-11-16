# OpenDayCare

OpenDayCare es una app web (Next.js App Router) para la comunicación y gestión diaria de una sala de guardería. La UI y los flujos se desarrollan de forma guiada por especificaciones en `specs/` y referencias visuales en `references/`, con integración progresiva a Supabase.

## Estado actual

- **Rutas implementadas (UI + integración parcial a Supabase):**
  - `/` — Feed de sala (SPEC 01): encabezado, composer, separador y publicaciones con datos ficticios, más sección de ejemplo consultada desde Supabase (`todos`) y carga de perfil autenticado.
  - `/login` y `/activar-cuenta` — Pantallas de acceso y activación de cuenta (SPEC 03, SPEC 14).
  - `/kids` y `/kids/[id]` — Listado y detalle de niños (SPEC 02, SPEC 10, SPEC 11) con datos obtenidos vía helpers de Supabase.
- **Autenticación y protección de rutas:** `proxy.ts` (raíz) + `utils/supabase/proxy.ts` refrescan sesión y aplican redirecciones entre rutas protegidas y rutas públicas de auth (`/login`, `/activar-cuenta`) (SPEC 09).
- **Invitaciones:** utilidades en `utils/invitations.ts` y dependencia `resend` para flujos de invitación/vinculación/activación según specs (p. ej. SPEC 12, SPEC 13, SPEC 14).
- **Specs disponibles:** `specs/01-feed-home.md` a `specs/14-validacion-invitacion-activar-cuenta.md` (UI, modales, auth/protección, integración DB/kids e invitaciones).
- **Base de datos / Supabase:** migraciones en `supabase/migrations/` (fundación core, seed de usuarios de prueba de dominio e invitaciones). Schema de referencia externo: `/datos/openCode/07-DB-Schema/opendaycare-database-schema.md` (mantener alineado con migraciones y app).
- **Automatización:** workflow en `.github/workflows/opencode.yml`.

## Stack

- Next.js `16.4.6` (App Router) + React `19.3.0`
- TypeScript (strict)
- Tailwind CSS `4.3.3`
- ESLint (`eslint-config-next`)
- Supabase: `@supabase/ssr`, `@supabase/supabase-js`
- Resend (`resend`) para envío de correos de invitación (según configuración)

## Estructura principal

- `app/layout.tsx` — layout raíz, metadata y fuentes (`Fredoka`/`Nunito`).
- `app/page.tsx` — home/feed (UI + consultas Supabase).
- `app/login/page.tsx`, `app/activar-cuenta/page.tsx` — pantallas de autenticación/activación.
- `app/kids/page.tsx`, `app/kids/[id]/page.tsx` — pantallas de niños.
- `app/components/` — componentes UI (`feed/`, `auth/`, `kids/`, `shell/`).
- `app/globals.css` — estilos globales/base visual.
- `proxy.ts` — protección/redirección de rutas y refresco de sesión.
- `utils/supabase/` — integración Supabase (`server.ts`, `client.ts`, `proxy.ts`, helpers de perfil/kids).
- `utils/invitations.ts` — utilidades de invitaciones.
- `supabase/migrations/` — migraciones SQL versionadas.
- `specs/` — especificaciones del producto y configuración spec-driven (`.spec-config.yml`).
- `references/` — plantillas/mockups y capturas de referencia.
- `public/` — assets estáticos.

## Desarrollo

Requisitos: Node.js y npm.

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variables de entorno

El repo incluye `,env`, `,env.template` y `.env.local` para configuración local (nota: algunos archivos usan nombres con coma según la convención actual del repo). No commitear secretos reales.

Variables relevantes (ver `,env.template`):
- Supabase (app): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- UI (si aplica): `NEXT_PUBLIC_LOGIN_DEFAULT_EMAIL`
- Supabase (scripts/operaciones, si aplica): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Invitaciones/correo (si aplica): `RESEND_API_KEY`, `INVITATION_FROM_EMAIL`, `INVITATION_FROM_NAME`, `NEXT_PUBLIC_SITE_URL`
- Datos de prueba/seed: placeholders `TEST_*` y `SUPBASE_DB_PASSWORD` (nombre según plantilla actual)

## Comandos

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción.
- `npm run start` — servir build de producción.
- `npm run lint` — ejecutar ESLint.
- `npx tsc --noEmit` — typecheck.

## Notas

- No hay suite de tests automatizados configurada actualmente.
- `next.config.ts` usa `cacheComponents`, `partialPrefetching` y configuración de Turbopack para CSS; tener en cuenta las implicaciones de acceso dinámico (`cookies()`/`headers()`) en App Router.
- Para cambios guiados, ver `specs/.spec-config.yml` y `AGENTS.md` (flujo `/spec` y `/spec-impl`, convenciones, tooling y notas de Supabase/Next.js).
