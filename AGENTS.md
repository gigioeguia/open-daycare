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
- Entrypoints: `app/layout.tsx` (root layout/metadata/fonts) and `app/page.tsx` (home route). Global styles in `app/globals.css` (`@import "tailwindcss"`).
- Path alias: `@/*` → repo root (see `tsconfig.json`).
- `next.config.ts`: `cacheComponents`, `partialPrefetching`, `experimental.agentFeedback`, and a custom `turbopack.rules` loader for `*.css` via `@tailwindcss/turbopack`.
- `eslint.config.mjs` uses `eslint-config-next` core-web-vitals + TypeScript presets.

## References & tooling
- `references/pantallas/` and `references/screenshots/` contain UI mockups/screenshots; use them as design reference for implementation.
- Playwright MCP is configured in `opencode.json`; store Playwright screenshots/artifacts in `.playwright/` (not repo root or other folders).
- Use Context7 MCP for up-to-date framework/library docs before relying on training knowledge (especially for Next.js APIs/config).

## Spec Driven Development - Skills
- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos este skill para hacer las implementaciones.