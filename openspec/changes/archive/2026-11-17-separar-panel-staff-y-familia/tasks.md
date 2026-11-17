# Tasks

## 1. Infraestructura de áreas y guardas de ruta

- [x] 1.1 Extender `proxy.ts` y `utils/supabase/proxy.ts` con guardas de área por rol (`/staff` para admin+staff; `/family` para parent), incluyendo redirección de acceso cruzado y de `/` y `/kids` al área del rol. Verificación: `npx tsc --noEmit` sin errores en proxy; proxy resuelve rol y redirige según área.
- [x] 1.2 Asegurar que el post-login redirija siempre al área del rol (`/staff` o `/family`) resolviendo `users.role` desde sesión. Verificación: tras login válido, navegación aterriza en `/staff` (staff/admin) o `/family` (parent).
- [x] 1.3 Implementar guardas de rol en layouts/pages de `/staff/*` y `/family/*` (rechazo o redirect al área propia si el rol no coincide). Verificación: un `parent` que navega a `/staff/*` va a `/family`; un `staff`/`admin` a `/family/*` va a `/staff`.

## 2. Área de staff y admin (`/staff`)

- [x] 2.1 Crear árbol de rutas `/staff/...` con landing `/staff` y layout/shell propios (AppShell + Sidebar + UserBadge), reutilizando componentes existentes. Verificación: `/staff` renderiza shell de staff con nav (Feed, Niños, Avisos, Cuenta) y botón Nueva publicación.
- [x] 2.2 Mover/adaptar Feed de sala (`/`) como landing de staff (`/staff/feed` o `/staff`) con publicaciones y creación de posts restringida a staff/admin. Verificación: feed de staff muestra publicaciones; solo staff/admin ven acciones de crear/editar/eliminar.
- [x] 2.3 Mover/adaptar gestión de niños (`/kids`, `/kids/[id]`) bajo `/staff/kids` y `/staff/kids/[id]` para staff/admin. Verificación: `/staff/kids` lista niños y permite alta/vínculo; accesible solo para staff/admin.
- [x] 2.4 Ajustar enlaces internos del shell (brandHref, navItems, controles) para apuntar al área `/staff`. Verificación: clics en nav del shell permanecen dentro de `/staff/*`.

## 3. Área de familia (`/family`)

- [x] 3.1 Crear árbol de rutas `/family/...` con landing `/family` y layout/shell propios para el rol parent. Verificación: `/family` renderiza shell de familia con nav (Feed, Mis hijos, Avisos, Cuenta) sin acciones de gestión de guardería.
- [x] 3.2 Implementar feed de familia filtrado por hijos vinculados (`parent_children`) y anuncios de sala de sus hijos, vía `utils/supabase/feed.ts`/`get-kids-list`/`get-kid-profile` adaptados. Verificación: un `parent` ve solo publicaciones de sus hijos vinculados y anuncios de sus salas.
- [x] 3.3 Implementar vista "Mis hijos" con datos de hijos vinculados (perfil básico) sin listado general de niños. Verificación: familia no ve listado general de niños; solo datos de sus hijos vinculados.
- [x] 3.4 Ajustar enlaces internos del shell para apuntar al área `/family`. Verificación: clics en nav del shell permanecen dentro de `/family/*`.

## 4. Compatibilidad y redirecciones desde rutas actuales

- [x] 4.1 Convertir `app/page.tsx` (`/`) y `app/kids/page.tsx` (`/kids`) en puntos de redirección al área del rol autenticado (o conservar para el rol correspondiente). Verificación: `/` y `/kids` redirigen a `/staff` o `/family` según rol; sin sesión redirigen a `/login`.
- [x] 4.2 Manejar `/kids/[id]`: staff/admin bajo `/staff/kids/[id]`; `parent` solo si el niño está vinculado, si no redirect a su área. Verificación: acceso de parent a hijo no vinculado redirige a `/family`.
- [x] 4.3 Actualizar `proxy.ts` matcher y reglas para excluir assets estáticos y permitir redirecciones autenticado→área. Verificación: assets (`_next/static`, imágenes, favicon) no son interceptados; redirecciones de área funcionan.

## 5. Consultas y datos alineados por rol (sin nuevo esquema)

- [x] 5.1 Revisar y ajustar consultas de dominio (`get-kids-list`, `get-kid-profile`, `get-current-user-context`, `feed.ts`) para que `parent` filtre por `parent_children` y `staff`/`admin` vean su guardería/sala. Verificación: consultas respetan aislamiento por rol y guardería (`daycare_id`).
- [x] 5.2 Confirmar que no se introducen tablas, columnas, enums, RLS ni triggers nuevos fuera de lo estrictamente necesario. Verificación: `npx tsc --noEmit` y `npm run lint` limpios; sin migraciones nuevas en este change.

## 6. Verificación técnica y de integración

- [x] 6.1 Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`. Verificación: todos finalizan sin errores (0 errores de lint/type/build).
- [x] 6.2 Verificación manual de escenarios clave: login staff/admin → `/staff`; login parent → `/family`; acceso cruzado redirige; familia ve solo hijos vinculados; logout → `/login`. Verificación: navegación end-to-end por rol cumple la spec.

## Workflow follow-up

- Revisar y, si corresponde, archivar el change `separar-panel-staff-y-familia` una vez implementado y verificado.
