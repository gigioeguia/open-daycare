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
- UI actual (feed con datos ficticios + integración parcial Supabase DB en `/`): 
  - `/` — feed de sala (componentes en `app/components/feed/`, datos en `feed-data.ts`).
  - `/login` — pantalla de acceso (`app/components/auth/`).
  - `/activar-cuenta` — pantalla de activación de cuenta (`app/components/auth/`).
  - `/kids` y `/kids/[id]` — listado y detalle de niños (`app/components/kids/`, `app/components/shell/`).
- Path alias: `@/*` → repo root (`tsconfig.json`).
- `next.config.ts`: `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback`, y `turbopack.rules` para `*.css` con `@tailwindcss/turbopack`.
- `eslint.config.mjs`: presets `eslint-config-next` (core-web-vitals + TypeScript) e ignores adicionales para `references/**`.
- Especificaciones funcionales/UI en `specs/` (`01-feed-home.md` a `07-core-db-foundation-migrations.md`, `.spec-config.yml`).

## Structure (high level)
- `app/` — rutas App Router y UI.
  - `app/page.tsx`, `app/login/page.tsx`, `app/activar-cuenta/page.tsx`, `app/kids/page.tsx`, `app/kids/[id]/page.tsx`.
  - `app/components/feed/`, `app/components/auth/`, `app/components/kids/`, `app/components/shell/` — componentes y datos de UI.
- `references/pantallas/`, `references/screenshots/` — mockups/plantillas de referencia visual (si existen).
- `specs/` — especificaciones y configuración del flujo spec-driven.
- `supabase/migrations/` — migraciones SQL versionadas (p. ej. fundación core).
- `.github/workflows/` — workflows de CI/automatización (p. ej. `opencode.yml`).
- `public/` — assets estáticos.
- `,env`, `,env.template` — variables de entorno locales/plantilla (nombres con coma según repo actual).
- `skills-lock.json` — lock de skills instaladas.
- `.playwright/`, `.playwright-mcp/`, `playwright/` — artefactos/sesiones de Playwright (no usar como destino principal para capturas nuevas salvo contexto explícito).

## Supabase & database
- **Estado:** migraciones iniciadas en `supabase/migrations/` (ej. `20261115202917_create_core_foundation.sql`: enums/tablas core y trigger de bootstrap de perfil auth). **La app ya tiene integración Supabase vía paquetes propios** en `utils/supabase/` (cliente de servidor para RSC y cliente de navegador para componentes/clientes).
- **Utilidades creadas (usar estas en vez de instanciar clientes directamente):**
  - `utils/supabase/server.ts` — `createClient(cookieStore)` para Server Components / Server Actions. Usa `createServerClient` de `@supabase/ssr` con `cookies.getAll()`/`setAll`; `setAll` está protegido con try/catch porque en Server Components no siempre puede escribir cookies.
  - `utils/supabase/client.ts` — `createClient()` para componentes de cliente/navegador. Usa `createBrowserClient` de `@supabase/ssr`.
  - `utils/supabase/middleware.ts` — `createClient()` para middleware (misma firma que client.ts; revisar si se requiere cliente de servidor con `request.cookies` según el flujo de sesión).
- **Variables de entorno requeridas:** `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (definidas en `,env.template` / `,env`). No exponer `SUPABASE_DB_PASSWORD` ni service role key en el cliente.
- **Next.js 16 App Router + `cookies()`:** acceder a `cookies()`/`headers()` durante prerenderizado estático bloquea la página a menos que se envuelva en `<Suspense>` o se use `export const dynamic = "force-dynamic"` (incompatible con `nextConfig.cacheComponents`, ver `next.config.ts`). Preferir `<Suspense fallback={...}>` alrededor del acceso dinámico.
- **Schema de referencia (externo):** `docs` reference → `/datos/openCode/07-DB-Schema` (`opendaycare-database-schema.md`). Define tablas/enums para PostgreSQL/Supabase (p. ej. `daycares`, `users` vinculado a `auth.users`, `rooms`, `children`, `parent_children`, `invitations`, posts, etc.). Tratar como diseño objetivo; mantener alineación entre doc, migraciones y app.
- **Convenciones del schema:** PK `uuid`, `created_at`/`updated_at` `timestamptz`, valores persistidos en inglés, etiquetas de UI en español en la capa de presentación.
- **Entorno:** `,env.template` incluye `SUPBASE_DB_PASSWORD` (placeholder, nombre según repo actual). Al implementar, validar nombres reales de variables requeridas por Supabase/Next.js y no exponer secretos.
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