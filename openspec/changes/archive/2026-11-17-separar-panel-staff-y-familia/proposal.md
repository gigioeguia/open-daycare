# Proposal

## Why

La aplicación expone hoy una sola experiencia autenticada (`/`, `/kids`, `/kids/[id]`) donde `staff`/`admin` y `parent` comparten rutas, shell y navegación. Los `parent` pueden acceder a pantallas de gestión (`/kids`, `/kids/[id]`) orientadas a staff y no hay una experiencia diferenciada para la familia. Es necesario separar claramente el panel del staff (admin+staff) y la parte de la familia, cada uno con su área, rutas, navegación y autorización, manteniendo un único dominio de datos.

## What Changes

- **Rutas explícitas por área:**
  - `/staff/*`: área de gestión (admin y staff comparten panel). Landing: `/staff`.
  - `/family/*`: área de familia (`parent`). Landing: `/family`.
  - `admin` comparte el mismo panel que `staff` (sin área propia).
- **Redirecciones desde rutas actuales:**
  - `/` y `/kids` redirigen al área del rol autenticado (`/staff` o `/family`).
  - Cualquier acceso de un `parent` a `/staff/*` redirige a su área `/family`; cualquier acceso de `staff`/`admin` a `/family/*` redirige a `/staff`.
- **Redirección post-login:** siempre al área del rol tras iniciar sesión.
- **Familia (`parent`):** solo feed y datos de sus hijos vinculados (sin listado ni gestión general de niños).
- **Guardas de autorización en servidor** por rol en `proxy.ts`/layouts/pages y Server Actions, para evitar exposición accidental.
- **Un único dominio de datos** (guarderías, salas, niños, publicaciones, invitaciones, vínculos padre-niño) sin duplicar infraestructura.

**Fuera de alcance:** cambios de esquema/RLS que no sean estrictamente necesarios para la separación, autenticación OAuth/MFA, recuperación de contraseña, notificaciones, paginación avanzada, pruebas automatizadas.

## Capabilities

### New Capabilities

- `staff-family-panel-separation`: separa la aplicación en dos áreas autenticadas por rol (`/staff` para admin+staff; `/family` para parent), con rutas explícitas, redirecciones desde `/` y `/kids`, guarda de autorización por área/rol, landing por rol y experiencia de familia limitada a sus hijos vinculados.

### Modified Capabilities

- (none)

## Impact

- `proxy.ts` (raíz) y `utils/supabase/proxy.ts`: añadir guardas de área por rol sobre las rutas `/staff/*` y `/family/*`.
- Rutas/pages existentes (`/`, `/kids`, `/kids/[id]`) y nuevos árboles `/staff/*`, `/family/*` con layouts/shell/nav propios.
- Enlaces internos, `brandHref`, navItems y controles del shell (sidebar/drawer) para apuntar al área correcta.
- Consultas de dominio y RLS alineadas para que `parent` solo lea datos de sus hijos vinculados.
- Variables de entorno: ninguna nueva (reusa Supabase pública ya configurada).
