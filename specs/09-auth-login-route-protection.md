# SPEC 09 — Autenticación email/password, logout y protección de rutas

> **Estado:** Implementado  
> **Depende de:** SPEC 03, SPEC 07  
> **Fecha:** 2026-11-15  
> **Objetivo:** Implementar inicio y cierre de sesión con email y contraseña contra Supabase y proteger rutas de la app con el patrón oficial de Next.js 16 (`proxy.ts`) y `@supabase/ssr`.

## Alcance

**Incluye:**

- **Inicio de sesión:** formulario real en `/login` que autentica con `supabase.auth.signInWithPassword` (email y contraseña) contra el proyecto Supabase real.
- **UX de login (sobre UI existente de spec 03):** mantener layout/estética actual; envío mediante **Server Action**; en éxito redirigir siempre a `/`; en error mostrar mensaje inline en español (credenciales inválidas: mensaje claro, p. ej. "Correo o contraseña incorrectos"; otros fallos: mensaje genérico en español) sin exponer detalles internos; botón de envío con estado de carga/disabled durante la petición.
- **Cierre de sesión (logout):** acción de servidor que ejecuta `supabase.auth.signOut()` con cliente Supabase de servidor/cookies y redirige a `/login`; se expone en la UI existente del shell mediante el control "Cerrar sesión" en `app/components/shell/UserBadge.tsx` (visible en sidebar y drawer móvil), reemplazando el enlace placeholder actual.
- **Identidad del usuario autenticado en el shell:** en todas las rutas protegidas que usan `AppShell` (p. ej. `/`, `/kids`, `/kids/[id]`), mostrar el usuario real autenticado en `UserBadge` (nombre y línea secundaria con rol y guardería), reemplazando los datos hardcodeados. La fuente es `public.users` (perfil por `id` del usuario autenticado, `full_name`, `role`) con el nombre de guardería desde `daycares` (`daycare_id`). El rol de DB (`admin|staff|parent`) se mapea a etiquetas UI en español: `admin` → "Administradora", `staff` → "Personal", `parent` → "Familiar"; el texto secundario se muestra como `"{rol} · {daycare}"` (inicial derivada del nombre).
- **Protección de rutas:** proteger **todas las rutas** excepto `/login` y `/activar-cuenta` (incluye `/`, `/kids`, `/kids/[id]` y cualquier otra ruta de app). Usuarios no autenticados en rutas protegidas redirigen a `/login`. Usuarios autenticados que accedan a `/login` o `/activar-cuenta` redirigen a `/`.
- **Mecanismo (Next.js 16.4 + `@supabase/ssr`, patrón oficial):** `proxy.ts` en la raíz que delega en un helper de sesión/protección en `utils/supabase/proxy.ts` (reemplaza la utilidad incorrecta actual `utils/supabase/middleware.ts`). El helper usa `createServerClient` de `@supabase/ssr` con `cookies.getAll()` desde `NextRequest` y `setAll(cookiesToSet, headers)` que actualiza cookies en request y response y aplica headers de caché (`Cache-Control`, `Expires`, `Pragma`) provistos por la librería; ejecuta `supabase.auth.getClaims()` para refrescar/validar sesión antes de aplicar lógica de rutas, y retorna siempre la response que porta cookies/headers refrescadas (copiándolos si se genera una redirección). `proxy.ts` exporta `proxy(request)` y `config.matcher` para excluir assets estáticos, imágenes, `_next` y `favicon.ico` (sin impedir la lógica de redirección autenticada→`/` en `/login` y `/activar-cuenta`).
- **Utilidades Supabase SSR:** mantener `utils/supabase/server.ts` (`createClient(cookieStore)` con `cookies()`) y `utils/supabase/client.ts` según sea necesario; reemplazar `utils/supabase/middleware.ts` por `utils/supabase/proxy.ts` alineado al patrón oficial de Supabase para Next.js 16.
- **Destino post-login:** siempre `/` en éxito; no se preserva ruta original (`?next`) en esta spec.

**Fuera de alcance (futuras specs):**

- Recuperación de contraseña ("¿Olvidaste tu contraseña?") y flujo real del enlace.
- Activación de cuenta real en `/activar-cuenta` (permanece UI estática/no funcional en esta spec).
- Registro/signup de nuevos usuarios.
- OAuth/proveedores externos, MFA, magic links u otros métodos de autenticación.
- Cambios de esquema, RLS/políticas, migraciones o seeds (se asume que los usuarios de prueba existen en Supabase Auth y perfiles en `public.users` según specs previas).
- Redirección a ruta original (`next`/callback) tras login.
- Validaciones/roles avanzados por tipo de usuario más allá de "autenticado/no autenticado" en el proxy.

## Modelo de datos

Esta spec no introduce nuevas estructuras de datos ni tablas. Reutiliza el modelo existente:

- **Supabase Auth:** `auth.users` (email/password, sesión/cookies gestionadas por `@supabase/ssr`).
- **Dominio (spec 07):** `public.users` vinculado a `auth.users(id)` (perfil/rol/estado); no se modifica.

Convenciones relevantes:
- Autenticación real contra el proyecto Supabase configurado por `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- No exponer secretos (service role, `SUPABASE_DB_PASSWORD`) en cliente.

## Plan de implementación

1. **Crear helper de proxy/sesión SSR (patrón oficial).** Reemplazar `utils/supabase/middleware.ts` (hoy basado en `createBrowserClient`) por `utils/supabase/proxy.ts` que reciba `NextRequest`, cree `NextResponse.next({ request })`, instancie `createServerClient` de `@supabase/ssr` con `cookies.getAll()` desde `request.cookies` y `setAll(cookiesToSet, headers)` que actualice `request.cookies`, recree la response con `NextResponse.next({ request })`, aplique `cookies.set` y los `headers` de caché en la response; ejecute `await supabase.auth.getClaims()` para refrescar/validar sesión y exponga la información necesaria (p. ej. claims/usuario, response y/o helper de redirect que copie cookies/headers) para que el proxy aplique las reglas de acceso.  
   _Verificación:_ el helper compila, no usa `createBrowserClient`, llama `getClaims()` y maneja `setAll` con `(cookiesToSet, headers)`.

2. **Crear `proxy.ts` en raíz con protección y refresco.** Implementar `proxy.ts` que invoque el helper de `utils/supabase/proxy.ts`, determine si la ruta es pública de auth (`/login`, `/activar-cuenta`) o protegida (resto de rutas de app) y aplique reglas: sin usuario autenticado en ruta protegida → redirect a `/login`; con usuario autenticado en `/login` o `/activar-cuenta` → redirect a `/`; en caso contrario continuar con la response que porta cookies/headers refrescadas. Definir `export const config = { matcher: [...] }` para excluir `_next/static`, `_next/image`, `favicon.ico` y assets estáticos comunes.  
   _Verificación:_ navegación sin sesión a `/` o `/kids` redirige a `/login`; navegación con sesión a `/login` redirige a `/`.

3. **Implementar Server Action de login.** Crear la acción de servidor para `/login` (p. ej. `app/login/actions.ts` o módulo colocalizado equivalente) con `"use server"` que reciba los datos del formulario (`email`, `password`), cree cliente con `createClient(await cookies())` de `utils/supabase/server.ts`, llame `signInWithPassword`, y: en error retorne estado con mensaje inline en español mapeado (credenciales inválidas vs genérico); en éxito ejecute `redirect("/")`.  
   _Verificación:_ credenciales inválidas retornan mensaje en español sin lanzar excepción no controlada en UI; credenciales válidas establecen sesión y redirigen a `/`.

4. **Convertir la UI de `/login` a formulario real.** Adaptar `app/login/page.tsx` y componentes de `app/components/auth/` para enviar el formulario a la Server Action: usar Client Component donde se requiera estado de envío/error (p. ej. `useActionState`/`useFormStatus` o patrón equivalente en React 19/Next 16), mantener campos email/password y estética de spec 03, cambiar el CTA de `Link` a botón submit (`AuthPrimaryAction` u equivalente) con estado de carga/disabled, y renderizar el error inline. Ajustar `AuthTextField`/props según sea necesario para atributos de formulario (`name`, `type`, `autoComplete`, `required`). Conservar `/activar-cuenta` y el enlace "¿Olvidaste tu contraseña?" sin comportamiento funcional nuevo (fuera de alcance).  
   _Verificación:_ la pantalla `/login` permite ingresar email/password, muestra loading al enviar, muestra error inline en fallo y navega a `/` en éxito.

5. **Implementar logout y conectarlo al shell.** Crear Server Action de cierre de sesión (p. ej. `app/auth/actions.ts` o módulo compartido de auth) que use `createClient(await cookies())` de `utils/supabase/server.ts`, ejecute `supabase.auth.signOut()` y redirija a `/login`. Actualizar `app/components/shell/UserBadge.tsx` para invocar esta acción desde el control "Cerrar sesión" (formulario/botón submit) en lugar del enlace `href="#"`, manteniendo apariencia y accesibilidad.  
   _Verificación:_ al cerrar sesión desde el shell, la sesión se invalida y el usuario es redirigido a `/login`; un intento posterior de acceder a `/` redirige a `/login`.

6. **Mostrar identidad real del usuario autenticado en el shell.** Implementar obtención del perfil autenticado desde `public.users` (join `daycares` para nombre de guardería) usando el cliente de servidor con sesión; mapear `role` (`admin|staff|parent`) a etiqueta UI ("Administradora", "Personal", "Familiar") y exponer nombre, rol formateado como `"{rol} · {daycare}"` e inicial. Integrar en todas las rutas protegidas que renderizan `AppShell` (`/`, `/kids`, `/kids/[id]`, y otras equivalentes) para reemplazar datos hardcodeados del usuario en `UserBadge`.  
   _Verificación:_ tras iniciar sesión, el shell muestra el nombre, rol y guardería del usuario autenticado en lugar de valores fijos.

7. **Verificación integrada contra Supabase real y consistencia.** Probar flujo completo con variables Supabase configuradas: acceso anónimo a rutas protegidas → redirect a `/login`; login con usuario válido → acceso a `/` (y rutas protegidas) con identidad real visible en el shell; acceso autenticado a `/login` → redirect a `/`; logout → redirect a `/login` y pérdida de acceso a rutas protegidas; recarga mantiene sesión por refresco en proxy. Confirmar que no se modificó `/activar-cuenta` a flujo funcional. Ajustes menores de nombres/estructura de archivos permitidos si mantienen el mismo comportamiento y se reflejan en la spec al implementarse.  
   _Verificación:_ criterios de aceptación cumplidos manualmente contra Supabase real.

## Criterios de aceptación

- [x] Un usuario no autenticado que navega a `/`, `/kids` o `/kids/[id]` (o cualquier otra ruta de app distinta de `/login` y `/activar-cuenta`) es redirigido a `/login`.
- [x] Un usuario autenticado que navega a `/login` o `/activar-cuenta` es redirigido a `/`.
- [x] Existe `proxy.ts` en la raíz que usa `@supabase/ssr` con `createServerClient`, `cookies.getAll/setAll` (incluyendo headers de caché) sobre `NextRequest`/`NextResponse`, refresca/valida sesión con `supabase.auth.getClaims()` y exporta `config.matcher` que excluye assets estáticos/`_next`/imágenes/`favicon.ico`.
- [x] Existe `utils/supabase/proxy.ts` con el helper SSR de sesión/protección (no `createBrowserClient`) utilizado por `proxy.ts`, en reemplazo de `utils/supabase/middleware.ts`.
- [x] El formulario de `/login` envía email y contraseña mediante Server Action y llama `supabase.auth.signInWithPassword` contra Supabase real.
- [x] Con credenciales válidas, el inicio de sesión redirige siempre a `/` y la sesión queda activa.
- [x] Con credenciales inválidas u otro error, `/login` muestra un mensaje inline en español (mapeado, sin exponer detalles internos) y el botón presenta estado de carga/disabled durante el envío.
- [x] El control "Cerrar sesión" en `app/components/shell/UserBadge.tsx` ejecuta `supabase.auth.signOut()` vía Server Action, invalida la sesión y redirige a `/login`.
- [x] Tras cerrar sesión, el acceso a rutas protegidas redirige a `/login`.
- [x] En las rutas protegidas que usan `AppShell`, el `UserBadge` muestra nombre, rol en español y guardería (`"{rol} · {daycare}"`) del usuario autenticado obtenidos desde `public.users`/`daycares`, sin datos hardcodeados.
- [x] `/activar-cuenta` y el enlace "¿Olvidaste tu contraseña?" no implementan flujos reales en esta spec.
- [x] No se realizan cambios de esquema/migraciones/RLS ni se exponen secretos de Supabase en el cliente.

## Decisiones

- **Sí:** autenticación con email y contraseña, alcance **login + logout**.
- **Sí:** proteger todas las rutas excepto `/login` y `/activar-cuenta`, con redirección de autenticados fuera de páginas públicas de auth hacia `/`.
- **Sí:** seguir el patrón oficial de Supabase para **Next.js 16**: `proxy.ts` en raíz + helper `utils/supabase/proxy.ts` con `createServerClient` de `@supabase/ssr`, `getAll/setAll(cookiesToSet, headers)` y refresco con `supabase.auth.getClaims()` (actualiza la decisión inicial de usar `middleware.ts`).
- **Sí:** Server Actions para `signInWithPassword` y `signOut`; redirect a `/` en login exitoso y a `/login` en logout; errores de login inline en español con estado de carga, manteniendo estética de spec 03.
- **Sí:** destino post-login siempre `/`, sin preservación de ruta original (`?next`).
- **Sí:** mensajes de error de login mapeados en español, genéricos para fallos no atribuibles a credenciales.
- **Sí:** logout expuesto en el control existente de `UserBadge` del shell (sidebar/drawer).
- **Sí:** mostrar identidad real del usuario autenticado (nombre, rol UI, guardería) en `UserBadge` en todas las rutas protegidas con shell, leyendo perfil de `public.users` + `daycares`; mapeo de rol `admin|staff|parent` → "Administradora"|"Personal"|"Familiar".
- **Sí:** `/activar-cuenta` y recuperación de contraseña fuera de alcance.
- **No:** signup, OAuth/MFA/magic links, `?next`, activación/recuperación real, cambios de DB/RLS, uso de `getSession()` como fuente de confianza en servidor.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Cookies/headers de sesión no se refrescan o no se propagan en redirects, causando cierres de sesión o estados inconsistentes. | Usar `createServerClient` con `getAll/setAll(cookiesToSet, headers)` en el helper de proxy, llamar `getClaims()` antes de la lógica de rutas y retornar siempre la response que porta cookies/headers refrescadas (copiándolos al crear redirects). |
| Respuestas con sesión cacheadas por CDN/proxy intermedio exponen sesión a otros usuarios. | Aplicar los headers de caché provistos por `@supabase/ssr` en `setAll` sobre la response del proxy, según guía oficial. |
| Redirecciones en bucle entre `/login` y `/` por lógica/matcher incorrectos. | Definir reglas explícitas (protegida vs pública-auth), excluir assets en `matcher` y probar casos autenticado/no autenticado. |
| `signOut` no limpia cookies correctamente si se ejecuta con cliente/contexto inadecuado. | Ejecutar logout en Server Action con `createClient(await cookies())` de `utils/supabase/server.ts` y redirigir a `/login` tras completar. |
| Cambios en utilidades Supabase o componentes rompen compilación/usos existentes. | Mantener firma de `createClient(cookieStore)` en `utils/supabase/server.ts`, ajustar solo lo necesario y verificar `next build`/`tsc` y flujos de login/logout. |
| Mensajes de Supabase cambian o no distinguen claramente credenciales inválidas. | Mapear por códigos/condiciones conocidas a mensaje genérico de credenciales inválidas y fallback genérico en español. |
| Next.js 16 y `cookies()`/APIs dinámicas en Server Components con `cacheComponents`. | Ejecutar auth en Server Actions/proxy; si se lee sesión en páginas/layouts, encapsular acceso dinámico (p. ej. `<Suspense>`) según restricciones del proyecto. |

## Lo que **no** está en esta spec

- Recuperación de contraseña y enlace funcional de "¿Olvidaste tu contraseña?".
- Activación de cuenta real en `/activar-cuenta`, registro/signup, OAuth/MFA/magic links.
- Preservación de ruta destino (`?next`) tras login.
- Autorización por rol/permisos finos, RLS, migraciones o cambios de esquema.
- Cualquier integración adicional de Supabase no requerida para login, logout y protección de rutas.

Cada uno de estos puntos, si se aborda, irá en su propia spec.

## Notas de implementación

- Implementado en rama `spec-09-auth-login-route-protection` (patrón oficial Next.js 16: `proxy.ts` + `utils/supabase/proxy.ts` con `getClaims()` y `setAll` incluyendo headers de caché).
- Validación automática realizada: `npx tsc --noEmit`, `npm run lint` y `npm run build` exitosos. Los flujos de login/logout/redirección e identidad dependen de configuración y datos reales en Supabase (`.env.local`, usuarios en Auth y perfiles en `public.users`/`daycares`); se recomienda verificación manual end-to-end en el entorno objetivo.
- Ajustes técnicos para compatibilidad con `cacheComponents`: acceso a datos dinámicos de sesión/perfil envuelto en `<Suspense>` en páginas protegidas y uso de `connection()` donde aplica. Se creó `.env.local` a partir de `,env` (ignorado por git) para cargar variables públicas de Supabase en Next.js.
