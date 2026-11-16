# SPEC 12 — Vinculación de padre por invitación (Resend) y activación de cuenta

> **Estado:** Implementado  
> **Depende de:** SPEC 03, SPEC 05, SPEC 07, SPEC 09, SPEC 11  
> **Fecha:** 2026-11-15  
> **Objetivo:** Implementar el flujo completo para vincular un padre/madre/tutor a un niño: crear y persistir invitaciones desde el modal, enviar el correo con Resend y activar/registrar la cuenta con el código de invitación.

## Alcance

**Incluye:**

- **Migración de base de datos (repo + remoto):** crear y aplicar una migración SQL versionada en `supabase/migrations/<timestamp>_create_invitations.sql` (convención `YYYYMMDDHHMMSS`) contra el proyecto Supabase **OpenDaycare** (`ixhfvteeyzmwspyhupti`, ref `ixhfvteeyzmwspyhupti`) con el mismo contenido:
  - `CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');`
  - `CREATE TABLE public.invitations (...)` según la referencia (`docs/opendaycare-database-schema.md`, sección 6): `id uuid PK DEFAULT gen_random_uuid()`, `child_id uuid NOT NULL REFERENCES public.children(id)`, `invited_by uuid NOT NULL REFERENCES public.users(id)`, `full_name text NOT NULL`, `email text NOT NULL`, `relationship public.relationship_type NOT NULL`, `code text NOT NULL UNIQUE`, `status public.invitation_status NOT NULL`, `expires_at timestamptz NOT NULL`, `accepted_at timestamptz`, `created_at timestamptz`.
  - Sin RLS, sin triggers/policies, sin seeds, sin índices adicionales no definidos en la referencia.
- **Envío de correo con Resend (Node, servidor):** integrar el paquete `resend` y enviar el email de invitación desde servidor (Server Action), sin exponer claves al cliente.
  - Variables de entorno servidor: `RESEND_API_KEY` (requerida), `INVITATION_FROM_EMAIL` (requerida, remitente verificado en Resend), `INVITATION_FROM_NAME` (opcional, default `OpenDayCare`).
  - URL base del enlace de activación: `NEXT_PUBLIC_SITE_URL` (requerida para construir el enlace absoluto).
  - Contenido (idioma español), al crear o reemitir la invitación: asunto claro (p. ej. "Invitación para seguir a {nombre del niño} en OpenDayCare"), cuerpo en HTML simple + texto plano con nombre del invitado, niño y sala/guardería (si disponible), **código de invitación**, vigencia (7 días), instrucción breve y enlace directo a `/activar-cuenta?code={CODE}&email={email}`. No usar React Email.
- **Crear/reemitir invitación desde el modal “Vincular padre” (UI real, `/kids/[id]`):** mantener el disparador y la estructura visual de SPEC 05 (`KidParentsSection` / `LinkParentModal` / `KidParentsCard`) y convertir el envío en acción real:
  - Puede ejecutar la acción cualquier usuario autenticado con acceso a la ruta protegida (staff/admin), usando la sesión actual como `invited_by`.
  - Validación en cliente preservada (nombre solo letras/espacios Unicode, email con formato válido, parentesco obligatorio) y validación/errores definitivos en servidor.
  - Al abrir el modal se muestra un **código de invitación aleatorio** (5 caracteres alfanuméricos en mayúsculas, `A-Z0-9`), generado en cliente y estable mientras el modal permanece abierto; se regenera en cada apertura. Ese mismo código se envía al servidor, que lo valida (formato y unicidad/colisión contra `invitations.code`, permitiendo conservarlo al reemitir la misma invitación pendiente) y lo persiste/envía por correo. Si hay colisión, el servidor devuelve error para reintentar (cerrar y reabrir el modal).
  - Persistencia/reglas:
    - Si el padre ya está vinculado al niño (`public.parent_children` para ese `child_id` y el usuario padre correspondiente por email/cuenta, o vínculo existente inequívoco): rechazar con error inline en el modal (“Este padre ya está vinculado a este niño.”).
    - Si existe una invitación `pending` no expirada para el mismo `child_id` + `email` (comparación de email normalizada, p. ej. trim/lowercase): **reutilizar/reemitir** actualizando código, `full_name`, `relationship`, `invited_by`, `expires_at = now() + interval '7 days'`, `status='pending'`, `accepted_at=null` y reenviar el correo.
    - En caso contrario: crear nueva invitación `pending` con `expires_at = now() + 7 días`.
  - **UX del modal:** botón “Enviar invitación” con estado de carga/disabled durante el envío; en éxito cerrar el modal y mostrar confirmación breve en la UI del perfil (p. ej. mensaje/toast visible) “Invitación enviada a {email}”; en error (validación, conflicto “ya vinculado”, fallo Resend/BD) mantener el modal abierto con mensaje inline claro en español. No modificar la lista de padres mostrada salvo que una spec futura lo requiera (el padre se vincula al aceptar).
- **Activación/registro real en `/activar-cuenta`:** convertir la pantalla de SPEC 03 en flujo funcional (Server Action), preservando layout/estética general:
  - Prellenar `code` y `email` desde query params `?code=&email=` (valores editables). Contraseña requerida. Consentimiento con checkbox interactivo y **obligatorio** (reemplaza el marcado estático).
  - Al enviar: validar invitación (`status='pending'`, no expirada por `expires_at > now()`, `code` y `email` coincidentes con el registro, normalización consistente de email/código).
  - **Cuenta sin existir (flujo soportado):** crear usuario en Supabase Auth con email+contraseña mediante operación privilegiada server-side (p. ej. `supabase.auth.admin.createUser` usando `SUPABASE_SERVICE_ROLE_KEY`, disponible solo en servidor, nunca en cliente) con `email_confirm: true` y `user_metadata` suficiente para el trigger `public.handle_new_auth_user` (`daycare_id` derivado del contexto de la guardería del niño de la invitación — vía `children.room_id -> rooms.daycare_id` o equivalente fiable —, `role='parent'`, `full_name` de la invitación). Luego crear `public.parent_children` (`parent_id` = id del usuario creado, `child_id` de la invitación, `relationship` de la invitación, respetando UNIQUE) y marcar la invitación `accepted` con `accepted_at=now()`.
  - **Sesión en éxito:** tras completar creación/vinculación/aceptación, iniciar sesión en servidor (`signInWithPassword` con email y contraseña provistos) y redirigir a `/`.
  - **Email ya con cuenta en Auth/`users` (fuera del flujo de creación en esta UI):** no crear otra cuenta; rechazar con mensaje inline claro en español: “Este correo ya tiene una cuenta. Iniciá sesión para vincularte.” (la vinculación de cuentas existentes por código se difiere). Si el niño ya está vinculado a ese padre, mostrar error claro (“Este padre ya está vinculado a este niño.”) cuando sea detectable.
  - **Errores inline en español** (modal abierto/página sin redirigir según corresponda): código o email inválidos/no coincidentes, invitación expirada/cancelada/aceptada/no encontrada, conflicto ya vinculado, fallo de envío o de servidor (mensaje genérico sin exponer detalles internos). Estados de carga/disabled en botones de envío.
- **Prerrequisitos de entorno (documentados):** `RESEND_API_KEY`, `INVITATION_FROM_EMAIL` (dominio verificado en Resend), `INVITATION_FROM_NAME` opcional, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor) y variables públicas de Supabase ya existentes. Actualizar `,env.template` con placeholders/nombres de las nuevas variables (sin secretos reales).

**Fuera de alcance (futuras specs):**

- Vincular por código a un padre que **ya tiene cuenta** iniciando sesión desde el mismo flujo (se rechaza en esta UI según decisión).
- Confirmación de email de Supabase personalizada, OAuth/MFA/magic links, recuperación de contraseña.
- Gestión de invitaciones (listado, reenvío manual dedicado, cancelación, expiración automática por job) y visualización de invitaciones pendientes en el perfil.
- Edición/eliminación de padres vinculados, permisos/acceso real fino por rol/RLS, o cambios en el feed por vínculo más allá de lo que ya soporte la app.
- React Email, plantillas en dashboard de Resend, adjuntos, o tracking avanzado.
- Pruebas automatizadas (E2E/unitarias) más allá de verificación manual/técnica indicada.

## Modelo de datos

**Nuevo (migración, literal a referencia de BD):**

```sql
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id),
  invited_by uuid NOT NULL REFERENCES public.users(id),
  full_name text NOT NULL,
  email text NOT NULL,
  relationship public.relationship_type NOT NULL,
  code text NOT NULL UNIQUE,
  status public.invitation_status NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz
);
```

**Reutilizado (existente):** `public.children`, `public.rooms`, `public.daycares`, `public.users` (perfil vinculado a `auth.users` por trigger `handle_new_auth_user`), `public.parent_children` (`UNIQUE (parent_id, child_id)`), `auth.users` (identidad/credenciales).

**Reglas de datos (aplicación/servidor):**

- Código: aleatorio, 5 caracteres, `[A-Z0-9]`, único en `invitations.code`. Se muestra al abrir el modal (cliente) y se envía al servidor para su validación/persistencia; el servidor verifica formato y unicidad (colisión) antes de crear/reemitir.
- Email: normalizado para comparación/persistencia consistente (p. ej. `trim().toLowerCase()` donde aplique la lógica de negocio).
- Vigencia: `expires_at = now() + interval '7 days'` al crear o reemitir.
- Reemisión (mismo `child_id` + email normalizado, invitación `pending` y `expires_at > now()`): actualizar registro existente (`code`, `full_name`, `relationship`, `invited_by`, `expires_at`, `status='pending'`, `accepted_at=null`).
- Aceptación: `status='accepted'`, `accepted_at=now()` y fila en `parent_children` creada en la misma operación lógica de activación.

## Plan de implementación

1. **Migración `invitations`.** Crear `supabase/migrations/<timestamp>_create_invitations.sql` con el DDL acordado y aplicar la misma migración al proyecto remoto (`apply_migration`, nombre coherente en snake_case). Verificar existencia de `invitation_status` e `invitations` y ausencia de RLS en la nueva tabla.
2. **Dependencias y utilidades de servidor.** Agregar `resend` a dependencias. Crear utilidades server-side tipadas (p. ej. en `app/lib/` o `utils/`) para: configuración/env (Resend, `INVITATION_FROM_*`, `NEXT_PUBLIC_SITE_URL`, service role), generación de código único (5 chars `A-Z0-9` con verificación de colisión), normalización de email/código, composición de asunto/cuerpo HTML+texto y envío con Resend.
3. **Server Action de invitación desde `/kids/[id]`.** Implementar acción que reciba `childId`, nombre, email y parentesco; valide sesión/entrada; detecte vínculo existente y casos de reemisión/creación según reglas; persista invitación; envíe correo; devuelva resultado tipado (éxito con email/código o error de campo/general). Derivar datos de contexto necesarios (p. ej. nombre del niño/sala/guardería) desde BD.
4. **Integrar modal y feedback en perfil.** Adaptar `link-parent-form.ts`/`LinkParentModal.tsx`/`KidParentsSection.tsx` (y/o piezas mínimas necesarias) para enviar al servidor, manejar loading/disabled, mostrar código/estado según respuesta, errores inline y cerrar en éxito; mostrar confirmación breve “Invitación enviada a {email}” en la UI del perfil tras éxito. Mantener accesibilidad y fidelidad visual razonable.
5. **Server Action y UI de activación `/activar-cuenta`.** Implementar acción que valide `code`, `email`, `password` y consentimiento; resuelva la invitación; maneje cuenta existente (rechazo con mensaje indicado) y flujo de creación con `SUPABASE_SERVICE_ROLE_KEY` + metadatos correctos; cree `parent_children`; marque invitación aceptada; inicie sesión (`signInWithPassword`) y redirija a `/`. Actualizar `app/activar-cuenta/page.tsx`, `app/components/auth/auth-data.ts` y componentes de auth para formulario real, prellenado por `searchParams`, checkbox de consentimiento obligatorio, errores inline y estado de carga.
6. **Plantillas de entorno y verificación técnica/manual.** Actualizar `,env.template` con las nuevas variables (placeholders). Verificar: `npm run lint`, `npx tsc --noEmit`, `npm run build`. Validar manualmente contra Supabase/Resend configurados: envío y recepción de correo con enlace/código, reemisión, rechazo por ya vinculado, activación exitosa con sesión y redirección a `/`, y casos de error (código/email inválido, expirada/aceptada, email con cuenta existente).

## Criterios de aceptación

- [x] Existe `supabase/migrations/20261116120000_create_invitations.sql` con `invitation_status` e `invitations` fieles a la referencia (campos, tipos, nullability, defaults, PK, UNIQUE `code`, FKs) y la migración fue aplicada al proyecto remoto Supabase **OpenDaycare** (versión `20261116024922`, nombre `create_invitations`); la tabla `invitations` no tiene RLS habilitado (`rls_enabled: false`, verificado por consulta).
- [x] El código se muestra al abrir el modal (5 chars `A-Z0-9`, generado en cliente y regenerado en cada apertura) y se envía al servidor; `app/kids/[id]/actions.ts` (`sendParentInvitation`) valida sesión, formato del código (`/^[A-Z0-9]{5}$/`) y unicidad contra `invitations.code`, crea o reemite invitación `pending` con `expires_at` a 7 días y rechaza si ya vinculado. Verificado estáticamente (`tsc`/`build`) y mediante recorrido E2E manual contra Supabase real (usuario).
- [x] `utils/invitations.ts` implementa envío vía Resend (`RESEND_API_KEY`, `INVITATION_FROM_EMAIL`/`INVITATION_FROM_NAME`, `NEXT_PUBLIC_SITE_URL`) en español con asunto/cuerpo HTML+texto, código, vigencia y enlace `/activar-cuenta?code=...&email=...`; la API key solo se lee en servidor. Envío verificado manualmente con credenciales reales (usuario).
- [x] `LinkParentModal.tsx` muestra carga/disabled durante el envío; en éxito cierra el modal y `KidParentsSection.tsx` muestra confirmación breve “Invitación enviada a {email}”; en error mantiene el modal abierto con mensaje inline en español y no persiste vínculo en `parent_children`. Verificado estáticamente (tsc/build OK) y en pruebas manuales (usuario).
- [x] `app/activar-cuenta/page.tsx` lee `code`/`email` de `searchParams` (prellenado editable), exige contraseña y consentimiento checkbox obligatorio (`ActivationForm.tsx`), y el Server Action valida invitación (código+email, `pending`, no expirada). Verificado estáticamente (tsc/build OK, prerender con `<Suspense>` + `instant = false`) y en pruebas manuales (usuario).
- [x] `app/activar-cuenta/actions.ts` implementa creación de cuenta con `admin.auth.admin.createUser` (`SUPABASE_SERVICE_ROLE_KEY`, solo servidor, `email_confirm: true`, `user_metadata` con `daycare_id`/`role='parent'`/`full_name`), inserta `parent_children`, marca invitación `accepted` con `accepted_at`, inicia sesión y redirige a `/`. Flujo E2E verificado manualmente contra Supabase real (usuario).
- [x] `app/activar-cuenta/actions.ts` rechaza si el email ya tiene cuenta (mensaje indicado sin crear otra cuenta) y si ya vinculado (“Este padre ya está vinculado a este niño.”); devuelve errores inline en español para invitaciones inválidas/expiradas/canceladas/aceptadas o no coincidentes. Verificado estáticamente (tsc/build OK) y en pruebas manuales (usuario).
- [x] `,env.template` incluye `RESEND_API_KEY`, `INVITATION_FROM_EMAIL`, `INVITATION_FROM_NAME`, `NEXT_PUBLIC_SITE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como placeholders (sin secretos reales). Verificado en archivo.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores (exit 0). Verificado tras ajustar prerrender de `/activar-cuenta` (`instant = false` + `<Suspense>`).

> **Nota de verificación:** la implementación fue verificada estáticamente (`lint`, `tsc`, `build`) y los flujos dependientes de credenciales reales (envío de correo con Resend, creación/activación de cuenta con Supabase y recorrido E2E de invitación/activación) fueron validados manualmente por el usuario en el entorno configurado. No se ejecutó automatización Playwright/E2E en CI.

## Decisiones

- **Sí:** alcance completo (2.a): migración `invitations` + invitación real desde modal + envío con Resend + activación/registro real.
- **Sí:** disparador desde modal “Vincular padre” en `/kids/[id]`, accesible a usuarios autenticados con acceso al perfil (3.a).
- **Sí:** código aleatorio (5 chars `A-Z0-9`) mostrado al abrir el modal (cliente) y enviado al servidor, que valida unicidad/colisión, persiste/reemite invitación y envía email; vigencia 7 días (4.a, ajuste solicitado en implementación).
- **Sí:** conflicto de invitación: reemitir si `pending` no expirada para mismo niño+email; error si ya vinculado (5.a).
- **Sí:** Resend con `RESEND_API_KEY`, `INVITATION_FROM_EMAIL`, `INVITATION_FROM_NAME` opcional (11.a) y enlace con base `NEXT_PUBLIC_SITE_URL` (7.a, 11.b1); HTML+texto plano, idioma español.
- **Sí:** `/activar-cuenta` con prellenado por query, consentimiento interactivo obligatorio, Server Action, y en éxito iniciar sesión + redirigir a `/` (8.a, 12.a).
- **Sí:** creación de cuenta con flujo privilegiado server-side (`SUPABASE_SERVICE_ROLE_KEY`, nunca en cliente) y metadatos para trigger de perfil; vinculación en `parent_children` y aceptación de invitación atómica a nivel lógico (9.a).
- **Sí:** si el email ya tiene cuenta, rechazar en esta UI con mensaje indicado y diferir vinculación de cuenta existente (10.a).
- **Sí:** feedback de modal con loading/disabled, confirmación “Invitación enviada a {email}” en éxito y errores inline en fallo (14.a).
- **Sí:** migración en repo y aplicada en remoto, sin RLS (13.a).
- **No:** vincular cuenta existente por código en este flujo, RLS/policies, React Email, gestión avanzada de invitaciones, pruebas automatizadas.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `INVITATION_FROM_EMAIL` no verificado o configuración de Resend incorrecta impide el envío. | Documentar prerrequisitos; manejar error de envío con mensaje genérico en UI y log/retorno controlado en servidor sin filtrar secretos. |
| Falta `SUPABASE_SERVICE_ROLE_KEY` o uso indebido en cliente expone privilegios. | Leer la key solo en código servidor/Server Actions; nunca importarla en Client Components; validar presencia y fallar con error genérico. |
| `handle_new_auth_user` requiere `daycare_id/role/full_name` en `raw_user_meta_data`; derivación incorrecta rompe creación de perfil. | Derivar `daycare_id` de forma determinista desde el niño/invitación (join room/daycare) y pasar metadatos explícitos al crear el usuario admin. |
| Condiciones de carrera generan códigos duplicados o reemisiones inconsistentes. | Generar código con reintentos ante colisión UNIQUE y aplicar reglas de búsqueda/actualización de forma consistente en servidor. |
| Usuario reintenta activación tras éxito parcial (usuario creado pero vínculo/aceptación fallidos). | Diseñar la secuencia para minimizar estados parciales y, si se detecta cuenta recién creada sin vínculo esperado, manejar con mensaje claro/orientación operativa (documentar comportamiento). |
| Normalización de email/código inconsistente entre envío y activación provoca “no encontrada”. | Centralizar helpers de normalización y usarlos en creación, reemisión, búsqueda y validación. |
| `expires_at`/comparación de tiempo dependiente de zona horaria. | Usar `timestamptz` y comparaciones en servidor/BD (`now()`) de forma consistente. |
| El `childId` recibido del cliente no corresponde al perfil mostrado o no es accesible. | Resolver y validar el niño en servidor por `childId` antes de crear invitación; no confiar en datos derivados solo del cliente. |

## Lo que **no** está en esta spec

- Vinculación de padres que ya poseen cuenta mediante este flujo de activación/invitación.
- RLS, políticas de seguridad, triggers de `updated_at` o cambios de esquema fuera de `invitation_status`/`invitations`.
- Gestión/cancelación/reenvío administrativo de invitaciones, expiración automática por tarea programada y UI de invitaciones pendientes.
- Personalización avanzada de correos (React Email, plantillas de Resend, tracking) o pruebas automatizadas.
- Flujos de autenticación adicionales (recuperación de contraseña, OAuth/MFA/magic links).

Cada uno de estos puntos, si se aborda, irá en su propia spec.
