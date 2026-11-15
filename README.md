# OpenDayCare

OpenDayCare es una app web (Next.js App Router) para la comunicación y gestión diaria de una sala de guardería. Actualmente implementa pantallas UI con datos ficticios, guiadas por especificaciones en `specs/` y referencias visuales en `references/`.

## Estado actual

- **UI implementada (feed con datos ficticios + integración Supabase DB en `/`):**
  - `/` — Feed de sala (SPEC 01, `specs/01-feed-home.md`): encabezado, composer, separador y publicaciones con datos ficticios, más sección de `todos` consultada desde Supabase.
  - `/login` y `/activar-cuenta` — Pantallas de acceso y activación (SPEC 03, `specs/03-auth-login-activation-ui.md`).
  - `/kids` y `/kids/[id]` — Listado y detalle de niños (SPEC 02, `specs/02-kids-screens-ui.md`).
- **Specs disponibles:** `01-feed-home.md` a `07-core-db-foundation-migrations.md` en `specs/` (incluye specs de modales y fundación de DB).
- **Supabase / Base de datos:** existe migración inicial en `supabase/migrations/20261115202917_create_core_foundation.sql` (enums/tablas core y bootstrap de perfil auth). La app **ya tiene integración de Supabase** vía clientes propios en `utils/supabase/` (cliente de servidor para RSC y cliente de navegador). Hay schema de referencia externo en `docs` (`/datos/openCode/07-DB-Schema/opendaycare-database-schema.md`).
- **Automatización:** workflow en `.github/workflows/opencode.yml`.

## Stack

- Next.js `16.4.6` (App Router) + React `19.3.0`
- TypeScript (strict)
- Tailwind CSS `4.3.3`
- ESLint (`eslint-config-next`)
- `@supabase/ssr` (clientes Supabase para servidor y navegador)

## Estructura principal

- `app/layout.tsx` — layout raíz, metadata y fuentes (`Fredoka`/`Nunito`).
- `app/page.tsx` — home/feed.
- `app/login/page.tsx`, `app/activar-cuenta/page.tsx` — pantallas de autenticación/activación (UI).
- `app/kids/page.tsx`, `app/kids/[id]/page.tsx` — pantallas de niños.
- `app/components/` — componentes UI (`feed/`, `auth/`, `kids/`, `shell/`).
- `app/globals.css` — estilos globales/base visual.
- `utils/supabase/` — clientes Supabase (`server.ts`, `client.ts`, `middleware.ts`).
- `specs/` — especificaciones del producto y configuración spec-driven.
- `supabase/migrations/` — migraciones SQL versionadas.
- `references/` — plantillas/mockups y capturas de referencia.

## Desarrollo

Requisitos: Node.js y npm.

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Comandos

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción.
- `npm run start` — servir build de producción.
- `npm run lint` — ejecutar ESLint.
- `npx tsc --noEmit` — typecheck.

## Notas

- No hay suite de tests automatizados configurada actualmente.
- Variables de entorno locales: el repo incluye `,env` y `,env.template` (nombres con coma). `,env.template` contiene placeholders; no commitear secretos reales. Para Supabase se requieren `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- El schema/diseño objetivo de base de datos debe mantenerse alineado con `docs/opendaycare-database-schema.md`, `supabase/migrations/` y las specs correspondientes.
- Para cambios guiados, ver `specs/.spec-config.yml` y `AGENTS.md` (flujo `/spec` y `/spec-impl`, convenciones y tooling del proyecto).
