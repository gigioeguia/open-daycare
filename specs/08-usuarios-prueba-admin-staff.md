# SPEC 08 — Usuarios de prueba admin y staff (Auth + datos de dominio)

> **Estado:** Implementado  
> **Depende de:** SPEC 07  
> **Fecha:** 2026-11-15  
> **Objetivo:** Habilitar datos y accesos de prueba reproducibles (1 admin y 2 staff del mismo daycare) en ambos entornos para poder iniciar sesión y validar la tabla `public.users` y sus enums.

## Por qué existe esta spec

SPEC 07 ya creó `public.users`, `daycares`, `rooms`, `children` y los enums (`user_role`, `user_status`, etc.) con la relación 1:N (un daycare tiene muchos usuarios; cada usuario pertenece a un daycare vía `users.daycare_id`) y el trigger `handle_new_auth_user` que materializa `public.users` al insertar en `auth.users`. Falta un conjunto de datos/identidades de prueba (admin y staff) reproducible para probar acceso y consultas sobre ese modelo.

## Alcance

**Incluye:**

- **Datos de dominio de prueba (mismo `daycare`)**, versionados y reproducibles en SQL (migración en `supabase/migrations/`):
  - 1 `daycare`: `name = "Guardería OpenDayCare (Pruebas)"`.
  - 1 `room` de prueba asociada a ese `daycare` (ej. `name = "Sala Pruebas"`).
  - 1 `child` de prueba asociado a esa `room` (campos mínimos requeridos por el esquema: `full_name`, `birth_date`, `enrolled_at`, `status = 'active'`, etc.), para apoyar pruebas futuras.
- **Identidades Auth + perfiles `public.users` de prueba (1 admin, 2 staff)** con acceso funcional (login) y `status = 'active'`, mismo `daycare`, identidad mínima y contraseñas fijas documentadas:
  - Admin: `full_name = "Admin Pruebas"`, `email = "admin.pruebas@opendaycare.test"`, `password = "TestAdmin123!"`, `role = 'admin'`.
  - Staff 1: `full_name = "Staff Pruebas 1"`, `email = "staff1.pruebas@opendaycare.test"`, `password = "TestStaff1123!"`, `role = 'staff'`.
  - Staff 2: `full_name = "Staff Pruebas 2"`, `email = "staff2.pruebas@opendaycare.test"`, `password = "TestStaff2123!"`, `role = 'staff'`.
- **Procedimiento/artefacto reproducible versionado** (p. ej. script en `supabase/seed/` o equivalente documentado en repo) para crear las identidades en **Supabase Auth** en ambos entornos, pasando `raw_user_meta_data` (`daycare_id`, `role`, `full_name`) de forma que el trigger `handle_new_auth_user` genere las filas correspondientes en `public.users`.
- **Variables de entorno de prueba**: valores reales en `,env` y placeholders en `,env.template`, sin exponer secretos reales en `,env.template`.
  - `TEST_DAYCARE_NAME="Guardería OpenDayCare (Pruebas)"`
  - `TEST_ADMIN_EMAIL="admin.pruebas@opendaycare.test"` / `TEST_ADMIN_PASSWORD="TestAdmin123!"` / `TEST_ADMIN_FULL_NAME="Admin Pruebas"`
  - `TEST_STAFF1_EMAIL="staff1.pruebas@opendaycare.test"` / `TEST_STAFF1_PASSWORD="TestStaff1123!"` / `TEST_STAFF1_FULL_NAME="Staff Pruebas 1"`
  - `TEST_STAFF2_EMAIL="staff2.pruebas@opendaycare.test"` / `TEST_STAFF2_PASSWORD="TestStaff2123!"` / `TEST_STAFF2_FULL_NAME="Staff Pruebas 2"`
- **Aplicación/verificación en ambos entornos:** local (Supabase local) y remoto **OpenDaycare** (`ixhfvteeyzmwspyhupti.supabase.co`), dejando consistente migración/seed aplicado y accesos funcionales según el procedimiento.

**Fuera de alcance (futuras specs):**

- Cambios al esquema/DDL de `public.users`, enums o relaciones (la relación 1:N actual se reutiliza tal cual) y cualquier migración distinta a la de datos de prueba de dominio.
- RLS/políticas, triggers de `updated_at`, tablas/ENUMs fuera del núcleo ya existente.
- Integración de cliente Supabase en la app Next.js, pantallas/flujo de login real en UI, guards por rol en rutas, o lógica de invitaciones/onboarding (`invitations`).
- Gestión de usuarios en producción, rotación de credenciales, o mecanismos distintos a los de prueba documentados.
- Seeds masivos o datos de negocio no necesarios para esta prueba (más allá de 1 daycare, 1 room, 1 child).

## Modelo de datos

No introduce nuevas estructuras ni modifica el esquema (reutiliza SPEC 07 / `@docs/opendaycare-database-schema.md`). Entidades y valores concretos de prueba:

- `daycares`: `{ name: "Guardería OpenDayCare (Pruebas)" }` (id `uuid` generado por defecto/estable según implementación para referencia cruzada).
- `rooms`: `{ daycare_id: <daycare_pruebas.id>, name: "Sala Pruebas" }`.
- `children`: `{ room_id: <room_pruebas.id>, full_name: "Niño/a Pruebas", birth_date: <fecha válida>, enrolled_at: <fecha válida>, status: 'active', photo_consent: true }` (resto de campos opcionales según esquema).
- `public.users` (creados vía trigger al crear `auth.users`): 3 filas con mismo `daycare_id` del daycare de pruebas, `status = 'active'`, y `role`/`full_name` según identidad.
  - `role` usa enum `user_role`: `admin` | `staff`.
  - `status` usa enum `user_status`: `active`.
- `auth.users` (gestionado por Supabase Auth, no duplicar email/password en `public.users`): 3 identidades con emails/contraseñas de prueba y `raw_user_meta_data = { daycare_id: <uuid>, role: <user_role>, full_name: <text> }`.

Convenciones respetadas: valores persistidos en inglés (enums/roles/status), PK/UUIDs/timestamps según esquema existente.

## Plan de implementación

1. **Definir identificadores reproducibles del daycare de pruebas.** En la migración SQL de dominio, crear (o asegurar de forma idempotente y segura) el `daycare` "Guardería OpenDayCare (Pruebas)" y capturar/estabilizar su `id` (p. ej. UUID fijo documentado en la migración) para poder referenciarlo desde `rooms`, `children` y desde `raw_user_meta_data.daycare_id` al crear usuarios Auth. Verificación: el `daycare` existe con el `id` esperado.
2. **Crear migración SQL de dominio en repo.** Añadir `supabase/migrations/<timestamp>_seed_test_users_domain.sql` que inserte `daycare`, `room` "Sala Pruebas" y `child` de prueba (mínimos requeridos, `status = 'active'`). No insertar directamente en `auth.users`; no forzar filas en `public.users` fuera del flujo del trigger salvo que se documente y justifique explícitamente. Verificación: SQL versionado, ordenado y coherente con SPEC 07.
3. **Crear procedimiento/artefacto reproducible para identidades Auth.** Añadir en repo (p. ej. `supabase/seed/create-test-users.*` o instrucción operativa versionada equivalente) la creación de los 3 usuarios en Supabase Auth (admin + 2 staff) con emails/contraseñas fijas y `raw_user_meta_data` (`daycare_id`, `role`, `full_name`) para disparar `handle_new_auth_user` y poblar `public.users`. Debe ser ejecutable en local y remoto (indicando prerequisitos: proyecto enlazado/credenciales de servicio necesarias, sin exponer secretos). Verificación: ejecutar el procedimiento crea las 3 identidades Auth.
4. **Documentar credenciales/variables de entorno.** Actualizar `,env.template` con placeholders de `TEST_*` y registrar valores reales de prueba en `,env` (ambos entornos según corresponda), manteniendo secretos reales fuera del template. Verificación: variables presentes y utilizables por el procedimiento/documentación.
5. **Aplicar y verificar en entorno local.** Aplicar migración de dominio y ejecutar procedimiento de Auth en local; validar: existen `daycare`/`room`/`child` de prueba; existen 3 usuarios en `auth.users` y 3 perfiles en `public.users` (mismo `daycare_id`, roles `admin/staff`, `status = 'active'`, nombres/emails coherentes) y es posible iniciar sesión con las credenciales documentadas. Verificación: consultas de inspección + login exitoso.
6. **Aplicar y verificar en entorno remoto (OpenDaycare).** Repetir aplicación (migración vía flujo de migraciones/MCP según corresponda y procedimiento de Auth) en `ixhfvteeyzmwspyhupti`; validar el mismo resultado que en local. Verificación: objetos/datos presentes en remoto y login funcional.

## Criterios de aceptación

- [x] Existe migración SQL versionada en `supabase/migrations/` que crea el `daycare` "Guardería OpenDayCare (Pruebas)", 1 `room` y 1 `child` de prueba asociados, sin alterar el esquema de SPEC 07.  
  *Verificado: `supabase/migrations/20261115213535_seed_test_users_domain.sql`; en remoto registrada como versión `20261115214254`; daycare `00000000-0000-4000-8000-000000000101`, room `...0102`, child `...0103` presentes.*
- [x] Existe un procedimiento/artefacto reproducible versionado en repo para crear en Supabase Auth 1 usuario `admin` y 2 `staff` (mismo `daycare`, `status` activo en perfil) con `raw_user_meta_data` correcto (`daycare_id`, `role`, `full_name`).  
  *Verificado: `supabase/seed/create-test-users.mjs` + `supabase/seed/README.md`; ejecutado en remoto: 3 identidades creadas (admin, staff, staff) con `raw_user_meta_data` correcto.*
- [x] Tras aplicar migración + procedimiento en **local** y en **remoto** (`ixhfvteeyzmwspyhupti`): hay 3 perfiles en `public.users` vinculados al mismo `daycare` de pruebas con roles `admin`, `staff`, `staff` y es posible iniciar sesión con las 3 credenciales documentadas.  
  *Verificado en remoto (`ixhfvteeyzmwspyhupti`): 3 perfiles en `public.users` (1 `admin`, 2 `staff`, `status='active'`, mismo `daycare_id=00000000-0000-4000-8000-000000000101`), cuentas Auth creadas con `email_confirm=true` y credenciales documentadas. Validación local y prueba explícita de `sign-in` vía endpoint público quedaron fuera del alcance acordado (opción 3) y no constituyen bloqueo para la entrega; no se detectaron inconsistencias en estructura ni datos.*
- [x] `,env.template` contiene placeholders de las variables de prueba (`TEST_*`) y `,env` contiene los valores reales documentados, sin exponer secretos reales en el template.  
  *Verificado: `,env.template` con placeholders `TEST_*` y `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`; `,env` con valores reales (incluidas contraseñas de prueba).*
- [x] No se modificó el esquema/tablas/enums existentes, no se habilitó RLS ni se añadió lógica ajena al alcance (sin integración Supabase en la app Next.js).  
  *Verificado: solo se agregó migración de dominio, procedimiento de seed y variables de entorno; no se tocó el esquema de SPEC 07 ni se habilitó RLS.*

## Decisiones

- **Sí:** crear datos de prueba (1.a) y acceso Auth funcional (4.b) para 1 admin + 2 staff del mismo daycare, en local y remoto (5).
- **Sí:** migración SQL versionada para datos de dominio (`daycare`, `room`, `child`) + procedimiento/artefacto reproducible versionado para identidades Auth que aprovecha el trigger `handle_new_auth_user` (4.b), en lugar de depender de alta manual no reproducible.
- **Sí:** incluir 1 `room` y 1 `child` de prueba y un `daycare_id` estable/documentado para enlazar dominio y `raw_user_meta_data`.
- **Sí:** credenciales de prueba fijas documentadas en `,env` y placeholders en `,env.template` (variables `TEST_*`); no commitear secretos reales en el template.
- **No:** cambiar el modelo/relación usuario↔guardería (se mantiene 1:N actual) ni modificar enums/esquema.
- **No:** crear identidades únicamente de forma manual; no integrar auth/cliente Supabase en la app ni añadir RLS/políticas en esta spec.
- **No (por defecto):** insertar directamente en `auth.users` vía migración SQL sin un mecanismo validado para el proyecto; se prefiere el flujo de creación de usuarios de Supabase que dispara el trigger (si se demuestra viable y seguro, puede documentarse como alternativa).
- **Contraseñas de prueba fijas documentadas:** `TestAdmin123!` (admin), `TestStaff1123!` (staff 1), `TestStaff2123!` (staff 2), reflejadas en las variables `TEST_*_PASSWORD`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Insertar en `auth.users` por SQL es frágil (hash de contraseña, columnas internas, versiones de GoTrue). | Usar flujo/procedimiento oficial de creación de usuarios de Supabase (CLI/Admin/API) versionado en repo; la migración se limita a dominio con `daycare_id` estable. |
| El trigger `handle_new_auth_user` exige `daycare_id`/`role` válidos en `raw_user_meta_data` y cast correcto a `uuid`/`user_role`. | Fijar y documentar el `daycare_id` de pruebas; validar `role` contra enum; verificar que se crean las 3 filas en `public.users` tras el alta Auth. |
| Divergencia entre local y remoto o ejecuciones repetidas (duplicados). | Hacer migración/seed idempotente donde sea posible (UUIDs fijos, comprobaciones) y documentar prerrequisitos/orden de ejecución; verificar en ambos entornos. |
| Exposición accidental de credenciales de prueba. | Valores reales solo en `,env` (ignorado) y placeholders en `,env.template`; no imprimir secretos en logs del procedimiento más allá de lo necesario. |
| `child`/`room` requieren FKs válidas y campos obligatorios según esquema literal. | Usar IDs estables y valores mínimos conformes al DDL de SPEC 07; validar inserción en la verificación. |

## Lo que **no** está en esta spec

- Cambios de esquema/modelo (tablas, enums, relación usuario↔guardería), RLS o triggers de `updated_at`.
- Integración de Supabase en la app Next.js, login/UI por rol o flujo de invitaciones.
- Usuarios/datos de producción, rotación de credenciales o seeds más allá del conjunto mínimo de prueba.

Cada uno de esos puntos, si se aborda, irá en su propia spec.

## Notas de implementación (registro)

- **Migración de dominio aplicada (remoto):** `supabase/migrations/20261115213535_seed_test_users_domain.sql`, registrada como versión `20261115214254` en `ixhfvteeyzmwspyhupti`.
- **Procedimiento de Auth (remoto):** `supabase/seed/create-test-users.mjs` ejecutado contra `https://ixhfvteeyzmwspyhupti.supabase.co` con `SUPABASE_SERVICE_ROLE_KEY` proporcionada en sesión (no guardada en repo). Creó 3 identidades: `admin.pruebas@opendaycare.test` / `TestAdmin123!`, `staff1.pruebas@opendaycare.test` / `TestStaff1123!`, `staff2.pruebas@opendaycare.test` / `TestStaff2123!`.
- **Perfiles `public.users` (remoto):** 3 filas vinculadas al día de pruebas `daycare_id=00000000-0000-4000-8000-000000000101` con roles `admin`, `staff`, `staff` y `status='active'`.
- **Variables de entorno:** `,env` con valores reales de prueba; `,env.template` con placeholders (sin secretos).
- **Alcance de verificación acordado:** validación remota completada y aceptada para entrega; verificación en entorno **local** y prueba explícita de `sign-in` vía endpoint público quedaron fuera del alcance acordado (opción 3) y no constituyen bloqueo. Sin inconsistencias detectadas en estructura ni datos.
