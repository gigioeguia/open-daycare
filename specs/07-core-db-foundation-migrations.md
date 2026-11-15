# SPEC 07 — Migración fundacional de base de datos (núcleo)

> **Estado:** Implementado  
> **Depende de:** —  
> **Fecha:** 2026-11-15  
> **Objetivo:** Crear y aplicar la primera migración SQL del núcleo de base de datos (ENUMs y tablas fundacionales) en Supabase, siguiendo literalmente el esquema de referencia.

## Alcance

**Incluye:**

- **ENUMs PostgreSQL** (valores en inglés, según `opendaycare-database-schema.md`):
  - `user_role`: `staff`, `parent`, `admin`.
  - `user_status`: `pending`, `active`.
  - `relationship_type`: `father`, `mother`, `guardian`.
  - `child_status`: `active`, `archived`.
- **Tablas del núcleo** (DDL literal al doc: nombres, columnas, tipos, nullability, defaults, PK, UNIQUE, FKs y `ON DELETE` indicados):
  - `daycares` (entidad raíz).
  - `users` (perfil de dominio vinculado a Supabase Auth).
  - `rooms` (salas).
  - `children` (niños).
  - `parent_children` (vínculo padre ↔ niño).
- **Automatización de perfil `users` (incluida):** función `SECURITY DEFINER` + trigger `AFTER INSERT` en `auth.users` que crea la fila en `public.users` usando el mismo UUID (`auth.users.id`) y tomando `daycare_id`, `role` y `full_name` desde `raw_user_meta_data` del signup (según nota de implementación del doc).
- **Artefacto de migración en repo:** archivo SQL versionado en `supabase/migrations/<timestamp>_create_core_foundation.sql` (timestamp UTC, convención Supabase `YYYYMMDDHHMMSS`).
- **Aplicación remota:** aplicar la misma migración al proyecto Supabase **OpenDaycare** (`ixhfvteeyzmwspyhupti.supabase.co`, ref `ixhfvteeyzmwspyhupti`) mediante `apply_migration` (MCP), registrando la migración en el proyecto.
- **Convenciones respetadas:** PK `id uuid` (default `gen_random_uuid()` donde corresponda), `created_at`/`updated_at` `timestamptz` según el doc, valores persistidos en inglés.

**Fuera de alcance (futuras specs):**

- RLS (no se habilita RLS en ninguna tabla del alcance) y políticas de acceso.
- Triggers/funciones de mantenimiento de `updated_at`.
- Resto de tablas/ENUMs del esquema (`invitation_status`, `post_type`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`).
- Índices adicionales no especificados en el doc (más allá de PK/UNIQUE declarados).
- Seeds/datos iniciales, generación de tipos TypeScript, integración de cliente Supabase en la app, Storage/Edge Functions/Auth UI.
- Ajustes al esquema que no estén en el doc (salvo los estrictamente necesarios para que el DDL literal sea ejecutable en Postgres/Supabase, a explicitar en implementación).

## Modelo de datos

Fuente de verdad: `@docs/opendaycare-database-schema.md` (secciones ENUMs, 1–5). Estructuras concretas a crear:

```sql
-- ENUMs
CREATE TYPE user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active');
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian');
CREATE TYPE child_status AS ENUM ('active', 'archived');

-- 1. daycares
CREATE TABLE daycares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- Ej. "Guardería Sala Soles"
  created_at timestamptz
);

-- 2. users (perfil vinculado a auth.users)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  role user_role NOT NULL,                 -- staff / parent / admin
  status user_status NOT NULL DEFAULT 'active',
  full_name text NOT NULL,
  avatar_url text,
  notify_on_post boolean NOT NULL DEFAULT true,
  daily_summary_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz,
  updated_at timestamptz
);

-- 3. rooms
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  name text NOT NULL, -- Ej. "Soles"
  created_at timestamptz
);

-- 4. children
CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id),
  full_name text NOT NULL,
  birth_date date NOT NULL,
  enrolled_at date NOT NULL,
  medical_notes text,
  allergy_tags text[],                     -- valores en inglés, ej. {peanut}
  photo_consent boolean NOT NULL DEFAULT true,
  status child_status NOT NULL,            -- active / archived
  created_at timestamptz,
  updated_at timestamptz
);

-- 5. parent_children
CREATE TABLE parent_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES users(id),
  child_id uuid NOT NULL REFERENCES children(id),
  relationship relationship_type NOT NULL,
  created_at timestamptz,
  UNIQUE (parent_id, child_id)
);
```

**Trigger de perfil `users` (incluido, según nota del doc):**

```sql
-- Función SECURITY DEFINER: crea perfil en public.users al insertar en auth.users
-- Lee daycare_id, role, full_name desde NEW.raw_user_meta_data
CREATE FUNCTION public.handle_new_auth_user() ...
RETURNS trigger SECURITY DEFINER ...

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
```

Notas de fidelidad/ejecución (derivadas del doc):
- `users.id` es FK a `auth.users(id)` ON DELETE CASCADE y usa el mismo UUID que Supabase Auth (sin `gen_random_uuid()` propio).
- `users.status` default `active`; el estado previo al signup se modela en `invitations` (fuera de alcance).
- No duplicar `email` ni `password_hash` en `public.users`.
- `allergy_tags` es `text[]` con valores en inglés.
- `daycares` y `rooms`: el doc solo lista `created_at` (sin `updated_at`); se respeta literal (2.a).
- No se agrega trigger de `updated_at` (3.a) ni se habilita RLS (4.a).

## Plan de implementación

1. **Crear estructura de migraciones en repo.** Asegurar existencia de `supabase/migrations/`. Generar archivo `supabase/migrations/<timestamp>_create_core_foundation.sql` (timestamp UTC `YYYYMMDDHHMMSS`) que contenga, en orden seguro de dependencias: creación de ENUMs; tablas `daycares`, `rooms`, `users`, `children`, `parent_children`; función `handle_new_auth_user` y trigger `AFTER INSERT` en `auth.users`. Verificación: archivo presente en repo con SQL completo y ordenado.
2. **Validar fidelidad del DDL.** Revisar que el contenido refleje literalmente las secciones 1–5 y ENUMs del doc (nombres, tipos, nullability, defaults, FKs/ON DELETE/UNIQUE) y que solo incluya los elementos acordados (trigger de perfil sí; sin RLS, sin trigger de `updated_at`, sin tablas/ENUMs fuera de alcance). Verificación: diff mental contra el doc sin desviaciones no justificadas.
3. **Aplicar migración al proyecto remoto.** Ejecutar `apply_migration` (MCP Supabase) contra **OpenDaycare** con `name` coherente (snake_case, p. ej. `create_core_foundation`) y el mismo `query` del archivo. Verificación: la herramienta responde sin error y la migración queda registrada.
4. **Verificar estado en base de datos.** Comprobar en el proyecto remoto: ENUMs creados; tablas `daycares`, `users`, `rooms`, `children`, `parent_children` existentes en `public` con columnas/constraints esperadas; función y trigger de perfil presentes; no hay tablas/ENUMs fuera de alcance creados por esta migración. Verificación: consultas de inspección (catálogo/`information_schema`/`pg_trigger`) coherentes con el modelo.
5. **Verificación final de consistencia.** Confirmar que el archivo en `supabase/migrations/` y la migración aplicada corresponden al mismo DDL y que el proyecto sigue sin RLS habilitado en estas tablas. Registrar en la spec cualquier ajuste mínimo de ejecutabilidad respecto al texto literal (si lo hubo).

## Criterios de aceptación

- [x] Existe el archivo `supabase/migrations/<timestamp>_create_core_foundation.sql` en el repo con el DDL del alcance (ENUMs + 5 tablas + función/trigger de perfil).
- [x] El DDL es fiel al `opendaycare-database-schema.md` para `user_role`, `user_status`, `relationship_type`, `child_status`, `daycares`, `users`, `rooms`, `children`, `parent_children` (nombres, tipos, nullability, defaults, PK, UNIQUE, FKs y `ON DELETE`).
- [x] Se crea la función `SECURITY DEFINER` y el trigger `AFTER INSERT` en `auth.users` que inserta en `public.users` (id, `daycare_id`, `role`, `full_name` desde `raw_user_meta_data`).
- [x] La migración fue aplicada al proyecto Supabase **OpenDaycare** (`ixhfvteeyzmwspyhupti.supabase.co`) mediante `apply_migration` y figura en el historial de migraciones.
- [x] En la base de datos remota existen las 5 tablas y los 4 ENUMs del alcance, con las constraints definidas, y no se crearon tablas/ENUMs fuera de alcance por esta spec.
- [x] No se habilitó RLS en las tablas del alcance y no se creó lógica de auto-actualización de `updated_at`.
- [x] No se modificó código de la app Next.js ni se introdujeron integraciones cliente de Supabase como parte de esta spec.

## Decisiones

- **Sí:** alcance núcleo (ENUMs + `daycares`, `users`, `rooms`, `children`, `parent_children`) como primera migración (1.a).
- **Sí:** crear archivo SQL en `supabase/migrations/` (convención Supabase) y aplicar la misma migración al remoto vía MCP `apply_migration` (1.a / 2.a).
- **Sí:** incluir trigger `AFTER INSERT` en `auth.users` para crear perfil `public.users` (3.b); RLS diferido.
- **Sí:** esquema literal al doc como fuente de verdad para el alcance (2.a).
- **No:** trigger/función de mantenimiento de `updated_at` (3.a).
- **No:** habilitar RLS en tablas del alcance (4.a).
- **No:** tablas/ENUMs restantes, índices extra, seeds, tipos generados, cliente Supabase en app.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Divergencia entre el archivo en repo y la migración aplicada remotamente. | Usar el mismo contenido SQL para el archivo y para `apply_migration`; verificar historial y objetos creados tras aplicar. |
| El trigger en `auth.users` asume claves en `raw_user_meta_data` (`daycare_id`, `role`, `full_name`) o tipos/casts compatibles. | Implementar la función siguiendo la nota del doc y validar comportamiento con un alta de prueba controlada en una spec/etapa de Auth; documentar supuestos. |
| Defaults de timestamps no explícitos en el doc (`created_at`/`updated_at` sin `DEFAULT now()`) pueden dejar valores nulos si la app no los envía. | Mantener fidelidad literal al doc en esta spec; si se requiere `DEFAULT now()`, tratarlo como ajuste explícito en implementación o spec futura. |
| `gen_random_uuid()` requiere soporte en el entorno Postgres. | Supabase/Postgres moderno lo soporta nativamente; confirmar en verificación si el DDL ejecuta sin requerir extensión adicional. |
| Re-ejecución accidental de DDL no idempotente. | Usar migración versionada única y comprobar historial (`list_migrations`) antes de aplicar. |

## Lo que **no** está en esta spec

- Habilitar RLS o definir políticas de seguridad.
- Auto-actualización de `updated_at`.
- Tablas/ENUMs fuera del núcleo (`invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`, `devices`, `invitation_status`, `post_type`).
- Índices adicionales, seeds, generación de tipos y cualquier cambio en la app Next.js/cliente Supabase.

Cada uno de esos puntos, si se aborda, irá en su propia spec.

## Notas de implementación (registro)

- **Migración en repo:** `supabase/migrations/20261115202917_create_core_foundation.sql` (DDL del alcance).
- **Migración aplicada (remoto, OpenDaycare `ixhfvteeyzmwspyhupti`):** `create_core_foundation` registrada como versión `20261115203341` vía `apply_migration` (MCP), con el mismo contenido SQL del archivo.
- **Consistencia:** ENUMs/tablas/constraints/función/trigger del alcance presentes en `public`/`auth` según verificación; sin objetos fuera de alcance. RLS verificado deshabilitado en las 5 tablas.
- **Ajustes mínimos de ejecutabilidad respecto al texto literal del doc:** calificación `public.`; `NOT NULL` en columnas obligatorias implícitas (p. ej. nombres, FKs requeridas, fechas de `children`, etc.); en `handle_new_auth_user` se añadió `SET search_path = public` y el insert del perfil asigna `status='active'` y `created_at/updated_at = now()` (además de `id`, `daycare_id`, `role`, `full_name` desde `raw_user_meta_data`).
- **Corrección de cumplimiento:** en la verificación inicial las 5 tablas tenían RLS habilitado; se ejecutó `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` (vía `execute_sql`) para cumplir la spec (4.a). El archivo de migración no fue modificado tras su aplicación.
