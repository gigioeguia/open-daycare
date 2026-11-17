# Design

## Context

Véase proposal.md (Why). Estado actual: una sola experiencia autenticada (`/`, `/kids`, `/kids/[id]`) compartida por `admin`, `staff` y `parent`. El shell (`AppShell`, `Sidebar`, `UserBadge`) y las rutas son comunes; solo `app/feed/actions.ts` restringe mutaciones de posts a `staff|admin`. No hay guardas de rol en `proxy.ts` ni en layouts/pages más allá de "autenticado vs no autenticado".

## Goals / Non-Goals

**Goals:**
- Dos áreas autenticadas por rol: `/staff/*` (admin+staff) y `/family/*` (parent).
- Redirecciones desde `/` y `/kids` y post-login al área del rol.
- Acceso cruzado entre áreas redirige al área propia del usuario.
- Familia (`parent`) solo ve feed y datos de sus hijos vinculados.
- Un único dominio de datos; sin duplicar infraestructura ni Supabase.

**Non-Goals:**
- Cambios de esquema/RLS no estrictamente necesarios para la separación.
- Autenticación OAuth/MFA, recuperación de contraseña, notificaciones, paginación avanzada.
- Área propia para `admin` distinta de `staff`.
- Pruebas automatizadas.

## Decisions

### 1. Prefijos de ruta explícitos: `/staff` y `/family` (vs conservar `/` y `/kids`)
**Razón:** separa visual y lógicamente ambas experiencias, hace los guards de rol sencillos y evita ambigüedad en `/kids` (gestión general vs solo hijos vinculados).
**Alternativas consideradas:** route groups sin prefijo público (`(staff)`/`(family)`) — descartados porque no exponen prefijos claros para redirects; URLs `/padres` — descartado por consistencia con código en inglés y evitar nombres duales.
**Impacto:** nuevos árboles de rutas `app/staff/...` y `app/family/...`; `app/page.tsx` y `app/kids/page.tsx` quedan como compatibilidad/redirect o se conservan para el rol correspondiente.

### 2. `admin` comparte panel con `staff` bajo `/staff`
**Razón:** ambas roles gestionan la guardería (publican, gestionan niños, invitan padres). Separarlas añadiría complejidad sin valor funcional hoy.
**Alternativa:** área `/admin` propia — descartada (sobrediseño).

### 3. Guards de área en `proxy.ts` (middleware/edge) + guardas en layouts/pages y Server Actions
**Razón:** `proxy.ts` ya gestiona sesión y redirecciones; extenderlo con área/rol es el punto único de autorización de ruta. Las páginas/layout refuerzan por defensa en profundidad; Server Actions validan rol para mutaciones.
**Defensa en profundidad:** incluso si un `parent` accede directo a `/staff/kids/[id]`, el layout/page de staff rechaza o redirige, y las consultas/RLS filtran por rol/vínculo.

### 4. Layouts y shell propios por área
**Razón:** navegación distinta (staff: Feed/Niños/Avisos/Cuenta + "Nueva publicación"; familia: Feed/Mis hijos vinculados/Avisos/Cuenta). Se reutilizan componentes existentes (`AppShell`, `Sidebar`, `UserBadge`) con `navItems` y acciones diferentes por área.
**UI en español, código en inglés.**

### 5. Destino post-login y post-logout por rol
**Razón:** tras login, resolver `users.role` y redirigir a `/staff` o `/family`. Logout lleva a `/login` (comportamiento actual).
**Nota:** `proxy.ts` resuelve el rol desde `public.users` (joineado con `daycares`) en sesión; se evita leer `cookies()` en prerenderizado estático sin `<Suspense>`.

### 6. Familia limitada a hijos vinculados (`parent_children`)
**Razón:** la familia no gestiona el día a día de la guardería; solo consulta su feed (hijos vinculados + anuncios de sala) y los datos de sus hijos.
**Datos:** consultas a `children` filtradas por `parent_children` del usuario autenticado; no se expone listado general de niños.

### 7. Sin migración de esquema nueva (salvo bloqueos)
**Razón:** la separación es de rutas/guardas/UI, no de modelo de datos. `users.role` ya existe y distingue admin/staff/parent.
**Riesgo:** si RLS actual permite a `parent` leer `children` de otros, se añaden policies/consultas filtradas por `parent_children` sin crear tablas nuevas.

## Risks / Trade-offs

| Riesgo | Mitigación |
|---|---|
| `parent` accede directo a URLs de `/staff/*` y ve datos de gestión | Guard en `proxy.ts` + rechazo/redirect en layouts de staff + consultas/RLS filtradas por rol |
| `staff`/`admin` accede a `/family/*` | Guard en `proxy.ts` + redirect a `/staff` |
| Cookies/sesión no refrescan en redirects, causando bucle `/staff` ↔ `/family` | Reglas explícitas de área por rol; probar casos autenticado/no autenticado y de cada rol |
| `/` y `/kids` actuales dejan de ser landings reales (se convierten en redirect) | Documentar como compatibilidad; actualizar enlaces internos (`brandHref`, nav, cards) |
| `cacheComponents`/render dinámico con acceso a rol en páginas | Envuelto en `<Suspense>`; auth en Server Actions/proxy, no en prerenderizado estático |
| Exposición accidental de `children` de otros padres vía API/consultas | Consultas filtradas por `parent_children` del usuario autenticado; validar con escenarios de rol |

## Open Questions

- (ninguna pendiente que cambie specs, enfoque o desglose de tareas)
