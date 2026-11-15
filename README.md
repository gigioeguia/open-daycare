# OpenDayCare

OpenDayCare es una app web (Next.js App Router) para la comunicación de una sala de guardería. El home (`/`) implementa el feed de **Sala Lunas** basado en la plantilla de referencia `references/pantallas/feed.dc.html`, con datos ficticios y UI estática.

## Estado actual

- **SPEC 01 — Home feed (Sala Lunas):** Implementado (`specs/01-feed-home.md`).
  - Ruta `/` con feed de sala (encabezado, composer, separador "PUBLICADO HOY" y 3 publicaciones).
  - Layout responsivo: sidebar fija en escritorio (`248px`) y top bar + drawer en móvil.
  - Tipografías `Fredoka`/`Nunito`, tema claro fijo (`#F6ECDF`), sin autenticación, navegación real ni base de datos integrada aún.

- **Supabase / Base de datos:** No integrado en el código (sin cliente/config en `package.json`). Existe schema de referencia externo en `docs` (`/datos/openCode/07-DB-Schema/opendaycare-database-schema.md`) para un futuro modelo PostgreSQL/Supabase.

## Stack

- Next.js `16.4.6` (App Router) + React `19.3.0`
- TypeScript (strict)
- Tailwind CSS `4.3.3`
- ESLint (`eslint-config-next`)

## Estructura principal

- `app/layout.tsx` — layout raíz, metadata y fuentes.
- `app/page.tsx` — home (feed).
- `app/globals.css` — estilos globales/base visual.
- `app/components/feed/` — componentes del feed, íconos (`icons/`) y datos (`feed-data.ts`).
- `references/pantallas/` — plantillas/mockups de referencia.
- `specs/` — especificaciones del producto.

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

> No hay suite de tests automatizados configurada actualmente.
