<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands
- `npm run dev` — Next.js dev server.
- `npm run build` — production build.
- `npm run start` — serve production build.
- `npm run lint` — run ESLint (`eslint`).
- `npx tsc --noEmit` — typecheck (strict TS; no dedicated `typecheck` script).
- No test script/config is currently defined.

## Project facts
- Next.js `16.4.6` App Router (`app/`) with React `19.3.0`, TypeScript strict, Tailwind CSS `4.3.3`.
- Entrypoints: `app/layout.tsx` (root layout/metadata, Fredoka/Nunito fonts) and `app/page.tsx` (home `/` feed). Global styles: `app/globals.css` (`@import "tailwindcss"`).
- UI actual (implementación guiada por specs, con integración parcial a Supabase en rutas de feed/kids/auth): 
  - `/` — feed de sala (componentes en `app/components/feed/`, datos en `feed-data.ts`); incluye consulta de ejemplo a Supabase (`todos`) y resolución de perfil autenticado.
  - `/login` — pantalla de acceso (`app/components/auth/`).
  - `/activar-cuenta` — pantalla de activación de cuenta (`app/components/auth/`).
  - `/kids` y `/kids/[id]` — listado y detalle de niños (`app/components/kids/`, `app/components/shell/`), con datos/perfil obtenidos vía utilidades Supabase según specs implementadas.
- **Protección de rutas:** `proxy.ts` (raíz) usa `utils/supabase/proxy.ts` (`updateSession`) para refrescar sesión y redirigir según autenticación (`/login`, `/activar-cuenta` como rutas públicas de auth).
- Path alias: `@/*` → repo root (`tsconfig.json`).
- `next.config.ts`: `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback`, y `turbopack.rules` para `*.css` con `@tailwindcss/turbopack`.
- `eslint.config.mjs`: presets `eslint-config-next` (core-web-vitals + TypeScript) e ignores adicionales para `references/**`.
- `proxy.ts`: protección/redirección de rutas autenticadas y públicas de auth (matcher excluye assets/estáticos de Next).
- Especificaciones funcionales/UI en `specs/` (`01-feed-home.md` a `14-validacion-invitacion-activar-cuenta.md`, `.spec-config.yml`).

## Structure (high level)
- `app/` — rutas App Router y UI.
  - `app/page.tsx`, `app/login/page.tsx`, `app/activar-cuenta/page.tsx`, `app/kids/page.tsx`, `app/kids/[id]/page.tsx`.
  - `app/components/feed/`, `app/components/auth/`, `app/components/kids/`, `app/components/shell/` — componentes y datos de UI.
- `utils/` — utilidades de dominio e integración.
  - `utils/supabase/` — clientes/helpers Supabase (`server.ts`, `client.ts`, `proxy.ts`, `get-current-user-profile.ts`, `get-kids-list.ts`, `get-kid-profile.ts`).
  - `utils/invitations.ts` — lógica relacionada con invitaciones.
- `proxy.ts` — protección de rutas/sesión en el borde de la app (Next.js).
- `references/pantallas/`, `references/screenshots/` — mockups/plantillas de referencia visual (si existen).
- `specs/` — especificaciones y configuración del flujo spec-driven.
- `supabase/migrations/` — migraciones SQL versionadas (fundación core, seeds/usuarios de prueba, invitaciones, etc.).
- `.github/workflows/` — workflows de CI/automatización (p. ej. `opencode.yml`).
- `public/` — assets estáticos.
- `,env`, `,env.template`, `.env.local` — variables de entorno locales/plantilla (algunos nombres con coma según convención actual del repo).
- `skills-lock.json` — lock de skills instaladas.
- `.playwright/`, `.playwright-mcp/`, `playwright/` — artefactos/sesiones de Playwright (no usar como destino principal para capturas nuevas salvo contexto explícito).

## Supabase & database
- **Estado:** migraciones en `supabase/migrations/` (p. ej. `20261115202917_create_core_foundation.sql`, `20261115213535_seed_test_users_domain.sql`, `20261116120000_create_invitations.sql`). La app integra Supabase mediante `@supabase/ssr`/`@supabase/supabase-js` y utilidades propias en `utils/supabase/`.
- **Utilidades creadas (usar estas en vez de instanciar clientes directamente):**
  - `utils/supabase/server.ts` — `createClient(cookieStore)` para Server Components / Server Actions (RSC). Usa `createServerClient` con `cookies.getAll()`/`setAll`; `setAll` está protegido con try/catch.
  - `utils/supabase/client.ts` — `createClient()` para componentes de cliente/navegador (`createBrowserClient`).
  - `utils/supabase/proxy.ts` — `updateSession(request)` para refrescar sesión/cookies en `proxy.ts` (raíz) y obtener usuario autenticado de forma segura.
  - `utils/supabase/get-current-user-profile.ts`, `get-kids-list.ts`, `get-kid-profile.ts` — helpers de consulta para datos de usuario/kids usados por la UI.
- **Protección de sesión/rutas:** `proxy.ts` (raíz) + `utils/supabase/proxy.ts` gestionan sesión y redirecciones entre rutas protegidas y públicas de auth (`/login`, `/activar-cuenta`).
- **Invitaciones/correo:** `utils/invitations.ts` y dependencia `resend` soportan flujos de invitación/activación según specs; requiere variables de entorno de invitación/Resend cuando aplique.
- **Variables de entorno:** requeridas para Supabase en cliente/servidor: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Para operaciones/scripts o flujos específicos pueden requerirse `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `INVITATION_FROM_EMAIL`, `INVITATION_FROM_NAME`, `NEXT_PUBLIC_SITE_URL` (ver `,env.template` / `.env.local` / `,env`). No exponer service role key ni secretos en el cliente.
- **Next.js 16 App Router + `cookies()`/acceso dinámico:** acceder a `cookies()`/`headers()` durante prerenderizado estático puede requerir `<Suspense>` o estrategia dinámica; `export const dynamic = "force-dynamic"` es incompatible con `cacheComponents` (`next.config.ts`). Preferir `<Suspense fallback={...}>` alrededor del acceso dinámico cuando corresponda.
- **Schema de referencia (externo):** `docs` reference → `/datos/openCode/07-DB-Schema` (`opendaycare-database-schema.md`). Define tablas/enums objetivo para PostgreSQL/Supabase (p. ej. `daycares`, `users`, `rooms`, `children`, `parent_children`, `invitations`, posts, etc.). Mantener alineación entre doc, migraciones y app.
- **Convenciones del schema:** PK `uuid`, `created_at`/`updated_at` `timestamptz`, valores persistidos en inglés, etiquetas de UI en español en la capa de presentación.
- **MCP/skills disponibles para tareas Supabase:** usar el server `supabase` en Code Mode (`tools.supabase.*`) y cargar skills `supabase` y/o `supabase-postgres-best-practices` antes de trabajar con DB, Auth, Storage, RLS, migraciones, Edge Functions, tipos, logs o performance Postgres.

## References & tooling
- `references/pantallas/` y `references/screenshots/` son la fuente de verdad visual para implementar UI.
- Playwright MCP configurado en `opencode.json`; guardar capturas/artefactos nuevos en `.playwright/`.
- Context7 MCP para documentación actualizada de librerías/frameworks/APIs antes de implementar.
- Supabase MCP (`tools.supabase.*`) para inspección/operaciones del proyecto Supabase cuando aplique.

## Spec Driven Development & skills
- **Flujo:** `/spec` para crear especificaciones, `/spec-impl` para implementarlas (`specs/.spec-config.yml`: `AutoCreateBranch: true`, `AutoCommitSteps: false`).
- **Skills instaladas (`skills-lock.json`):** `spec`, `spec-impl`, `supabase`, `supabase-postgres-best-practices`.
- **Uso recomendado:**
  - `/spec` / `/spec-impl`: definir e implementar cambios guiados por specs.
  - `/intellisense`: atender diagnósticos/sugerencias del editor (p. ej. clases Tailwind canónicas) y revisar casos similares.
  - `supabase`: tareas que involucren productos/librerías/CLI/Auth/Storage/Realtime/Edge Functions, debugging o configuración de Supabase.
  - `supabase-postgres-best-practices`: diseño/alteración de schema, migraciones, RLS/policies, índices, funciones/triggers, queries SQL y diagnóstico de performance/seguridad en Postgres.

## Reglas de código

- Usar código limpio: nombres, funciones, variables, etc. en inglés.
- Eliminar componentes antiguos ya no usados y que no alteren el comportamiento de la aplicación.
- Atender sugerencias de IntelliSense/diagnósticos del editor cuando sean reportadas o detectadas (p. ej. `suggestCanonicalClasses` de Tailwind: usar clases canónicas equivalentes como `rounded-2xl` en lugar de `rounded-[16px]`), y revisar patrones similares en el proyecto sin alterar el diseño/comportamiento.
- Mantener consistencia con la UI/spec de referencia y evitar introducir dependencias/infra (p. ej. Supabase) sin una spec o requerimiento explícito.