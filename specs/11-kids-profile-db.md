# SPEC 11 — Perfil de niño desde BD en `/kids/[id]`

> **Estado:** Implementado  
> **Depende de:** SPEC 02, SPEC 05, SPEC 07, SPEC 09, SPEC 10  
> **Fecha:** 2026-11-15  
> **Objetivo:** Conectar la ruta `/kids/[id]` a datos reales de Supabase para mostrar la información del niño solicitado y sus padres vinculados, indicando cuando no tenga padres relacionados y manteniendo siempre visible el botón para vincular otro padre.

## Alcance

**Incluye:**

- Consultar y renderizar en `app/kids/[id]/page.tsx` la información del niño desde la base de datos usando el parámetro `id` de la ruta como `children.id` (UUID), reemplazando el origen ficticio del perfil (`getKidProfileById`/`kids-data.ts`) para esta pantalla.
- Criterio de consulta: obtener el registro de `public.children` cuyo `id` coincida con el parámetro proporcionado, **sin filtrar por `status`** (se muestra la información disponible para el ID solicitado). Incluir contexto de sala desde `public.rooms` (join por `room_id`) cuando exista.
- Mapeo de UI del perfil (consistente con la vista actual de SPEC 02):
  - `name`: `children.full_name`.
  - `ageLabel`: calculado desde `children.birth_date` (años cumplidos, en español, p. ej. "2 años", "3 años").
  - `roomLabel`: `rooms.name` cuando exista sala asociada; si `room_id` es nulo o no hay nombre disponible, mostrar un valor de UI claro (p. ej. "Sin sala").
  - `birthDateLabel`: `children.birth_date` formateada en español (p. ej. "12 mar 2022").
  - `admissionLabel` (Ingreso): `children.enrolled_at` formateada en español (p. ej. "feb 2025").
  - `initial` y paleta de avatar: determinísticos según `full_name`, reutilizando la lógica/patrones existentes del listado (`app/components/kids/kids-list-presentation.ts`) para consistencia visual.
  - **Alergias y notas:** mostrar el bloque de aviso actual (`KidAllergyNotice`) **siempre**. Cuando hay información en `children.medical_notes` y/o `children.allergy_tags`, refleja los datos disponibles (texto de `medical_notes` y etiquetas de alergia). Cuando no hay información, muestra el mensaje **"Sin novedad"**.
- **Padres vinculados (solo lectura, desde BD):** consultar relaciones en `public.parent_children` para el `child_id` solicitado, uniendo con `public.users` para obtener el nombre del padre/tutor. Para cada vínculo mostrar nombre, etiqueta de relación y estado visual coherente con la UI actual (`LinkedParentItem`):
  - `relationship` (`father` / `mother` / `guardian`) se traduce en UI a **Padre / Madre / Tutor**.
  - Etiqueta secundaria sugerida: `"{Padre|Madre|Tutor} · activa"` (vínculo existente en BD), con estado activo consistente con el componente.
  - Inicial/avatar del padre derivados de su nombre (determinísticos, estilo consistente con el proyecto).
- **Sin padres relacionados:** si no existen registros en `parent_children` para el niño, la tarjeta de padres debe indicar explícitamente que no hay padres vinculados (mensaje visible en español, p. ej. "Sin padres vinculados.").
- **Botón "Vincular otro padre" siempre visible:** el control para vincular otro padre debe mostrarse siempre en la tarjeta de padres, tanto si hay padres vinculados como si no, manteniendo el comportamiento UI actual de SPEC 05 (abre el modal `LinkParentModal` contextual al nombre del niño, con validación en cliente y simulación de envío, **sin persistencia ni llamadas remotas**).
- **Estado no encontrado:** si no existe un niño con el `id` proporcionado (o la consulta no devuelve registro), mantener el estado actual de "Perfil no encontrado" con enlace para volver a `/kids`.
- **Estado de error de carga:** ante fallo al obtener datos desde Supabase, mostrar un estado simple dentro del layout/shell actual con mensaje en español (p. ej. "No pudimos cargar el perfil. Intenta nuevamente.") y opción de volver a `/kids`.
- Ajustes necesarios en `app/kids/[id]/page.tsx`, componentes de `app/components/kids/` y/o utilidades de acceso a datos (p. ej. `utils/supabase/`) para soportar datos reales del perfil y de padres vinculados, preservando el shell, la navegación y la apariencia general.
- Mantener sin cambios funcionales: `/kids` (listado y búsqueda), `/login`, `/activar-cuenta` y el comportamiento interno del modal de vinculación (no persiste).

**Fuera de alcance (para futuras specs):**

- Editar información del niño o acciones del botón "Editar".
- Persistir vínculos padre-niño, crear/aceptar invitaciones reales, enviar correos o modificar `parent_children`/`invitations` desde la UI.
- Mostrar invitaciones pendientes de `invitations` como padres vinculados/pendientes en el perfil.
- Cambios en el listado `/kids` (consulta, búsqueda, agrupación o datos).
- Cambios de esquema, migraciones nuevas, RLS/policies, triggers o seeds de datos.
- Funcionalidad real de "Resumen del día" u otras acciones placeholder del perfil.
- Pruebas automatizadas.

## Modelo de datos

No se introducen tablas ni columnas nuevas. Se reutilizan estructuras existentes (SPEC 07 / referencia de esquema DB):

- **`public.children`**: `id uuid` PK, `room_id uuid` nullable (FK `rooms`), `full_name text`, `birth_date date`, `enrolled_at date`, `medical_notes text`, `allergy_tags text[]`, `photo_consent boolean`, `status public.child_status`, `created_at timestamptz`, `updated_at timestamptz`.
- **`public.rooms`**: `id uuid` PK, `name text`, `daycare_id uuid`.
- **`public.parent_children`**: `id uuid` PK, `parent_id uuid` FK `users`, `child_id uuid` FK `children`, `relationship public.relationship_type` (`father`/`mother`/`guardian`), `created_at timestamptz`, UNIQUE (`parent_id`, `child_id`).
- **`public.users`**: `id uuid` PK (FK `auth.users`), `full_name text`, `role public.user_role`, `status public.user_status`, `avatar_url text`, etc.

**Modelo de UI derivado (perfil `/kids/[id]`):**

- Perfil de niño: `id`, `name` (`full_name`), `ageLabel` (derivado de `birth_date`), `roomLabel` (`rooms.name` o "Sin sala"), `birthDateLabel` y `admissionLabel` (formateadas en español desde `birth_date`/`enrolled_at`), `initial` y colores de avatar determinísticos por `full_name`, `allergyTitle` (siempre "Alergias y notas") y `allergyNote` (datos de `medical_notes`/`allergy_tags`, o "Sin novedad" si no hay información).
- Padre vinculado (solo lectura): `id` (del vínculo o usuario), `name` (`users.full_name`), `relationLabel` en español basado en `relationship` (p. ej. "Madre · activa", "Padre · activa", "Tutor · activa"), `initial`/`avatarBackground` determinísticos por nombre, `status = "active"` y `statusLabel = "ACTIVA"` para vínculos existentes.

Convenciones relevantes:

- Etiquetas de relación en UI: `father` → "Padre", `mother` → "Madre", `guardian` → "Tutor".
- La ruta consume el `id` proporcionado (UUID). No se aplica filtro por `status` del niño en la consulta por ID.
- No se exponen secretos ni se introducen cambios de esquema/RLS.

## Plan de implementación

1. **Crear acceso a datos del perfil en servidor.** Implementar en `utils/supabase/` (p. ej. `utils/supabase/get-kid-profile.ts`) funciones que usen `createClient` de `utils/supabase/server.ts` para: (a) obtener el niño por `id` con `rooms(name)` sin filtrar por `status`; (b) obtener padres vinculados desde `parent_children` + `users(full_name)` para ese `child_id`.  
   _Verificación:_ para un ID existente devuelve datos del niño y su lista de vínculos (vacía si no hay); para un ID inexistente devuelve `null`/vacío según contrato definido.

2. **Derivar y formatear datos de presentación.** Reutilizar/extraer utilidades para edad (`calculateAgeLabel`), inicial y paleta de avatar determinísticos por nombre (consistentes con `/kids`), y agregar formateo en español para `birthDateLabel` (día, mes abreviado, año) y `admissionLabel` (mes abreviado, año). Definir mapeo de `relationship_type` a etiqueta UI y construcción de `relationLabel`/estado activo para `LinkedParent`.  
   _Verificación:_ valores y etiquetas formateados son estables y coherentes (incluye nombres con acentos).

3. **Adaptar componentes de padres para estado vacío.** Actualizar `app/components/kids/KidParentsCard.tsx` y/o `app/components/kids/KidParentsSection.tsx` para renderizar un mensaje explícito cuando `parents.length === 0` (p. ej. "Sin padres vinculados.") y mantener siempre visible el botón "Vincular otro padre" que abre el modal existente.  
   _Verificación:_ con lista vacía se ve el mensaje y el botón; con lista no vacía se ven los padres y el botón.

4. **Conectar `/kids/[id]` a datos reales.** Refactorizar `app/kids/[id]/page.tsx` para leer el `id` (UUID) de `params`, cargar perfil y padres vinculados desde Supabase, y renderizar: estado "Perfil no encontrado" si no existe el registro, estado de error de carga ante fallo, o el perfil completo (header, info, alergias/notas si aplican, resumen del día placeholder, tarjeta de padres) con datos reales. Mantener uso de `AppShell`, `Suspense`/`connection()` y obtención de usuario actual según patrón protegido existente.  
   _Verificación manual:_ navegar a `/kids/{uuid-existente}` muestra datos de BD; `/kids/{uuid-inexistente}` muestra "Perfil no encontrado".

5. **Limpieza de dependencias ficticias y validación técnica.** Reducir/eliminar el uso de `getKidProfileById` y datos mock del perfil en la ruta, conservando solo lo que siga siendo necesario para otras partes fuera de alcance (si aplica). Ejecutar `npx tsc --noEmit`, `npm run lint` y `npm run build`.  
   _Verificación:_ compilación y lint sin errores; `/kids` no presenta regresiones.

## Criterios de aceptación

- [x] `app/kids/[id]/page.tsx` obtiene y muestra el perfil del niño desde `public.children` (con sala desde `public.rooms`) usando el `id` (UUID) de la ruta, sin depender de datos ficticios del perfil. Verificado en código (usa `getKidProfileById` de `utils/supabase/get-kid-profile.ts`; `getKidProfileById` de `kids-data.ts` eliminado de la ruta).
- [x] La consulta por ID no filtra por `children.status`; se muestra la información del registro correspondiente al ID proporcionado cuando existe. Verificado en código (`maybeSingle()` sin `.eq("status", "active")`).
- [x] El perfil muestra `full_name`, `ageLabel` calculado desde `birth_date`, `roomLabel` (nombre de sala o "Sin sala"), `birthDateLabel` y `admissionLabel` formateadas en español, e inicial/avatar determinísticos según `full_name`. Verificado en código (`mapKidProfile`).
- [x] El aviso de alergias/notas (`KidAllergyNotice`) se muestra siempre con título "Alergias y notas": con datos de `medical_notes`/`allergy_tags` cuando existen, o con el mensaje "Sin novedad" cuando no hay información. Verificado en código (`getAllergyNote`, renderizado incondicional del aviso).
- [x] Los padres vinculados se obtienen desde `parent_children` (join `users`) y se listan con nombre y relación en español (`father/mother/guardian` → Padre/Madre/Tutor) con presentación coherente con la UI existente (`LinkedParentItem`). Verificado en código (`getKidLinkedParents`, `mapLinkedParent`).
- [x] Si el niño no tiene registros en `parent_children`, la tarjeta de padres muestra un mensaje explícito indicando que no hay padres vinculados ("Sin padres vinculados."). Verificado en código (`KidParentsCard` renderiza el mensaje cuando `parents.length === 0`).
- [x] El botón "Vincular otro padre" es siempre visible en la tarjeta de padres (con y sin padres vinculados) y abre el modal de vinculación con el comportamiento UI actual, sin persistencia ni llamadas remotas. Verificado en código (`KidParentsCard` / `KidParentsSection` / `LinkParentModal` sin cambios de persistencia).
- [x] Si no existe un niño para el ID proporcionado, se muestra el estado "Perfil no encontrado" con enlace para volver a `/kids`. Verificado en código (`!profile` → "Perfil no encontrado").
- [x] Ante error de carga desde Supabase, se muestra un mensaje en español indicando que no se pudo cargar el perfil ("No pudimos cargar el perfil. Intenta nuevamente.") con enlace para volver a `/kids`. Verificado en código (`loadError`).
- [x] `/kids` (listado y búsqueda) y el flujo de login/protección de rutas no presentan regresiones. Verificado mediante `npm run build` (rutas generadas correctamente).
- [x] `npx tsc --noEmit`, `npm run lint` y `npm run build` finalizan sin errores. Verificado: tsc OK, lint OK, build OK.

> Nota: los criterios que dependen de datos reales de Supabase (filas en `children`/`parent_children`/`users`) requieren verificación end-to-end contra el proyecto Supabase con datos cargados; la estructura de código y la compilación están listas.

## Decisiones

- **Sí:** usar el parámetro de ruta como `children.id` (UUID) y consultar Supabase como fuente de verdad del perfil (1.a).
- **Sí:** mostrar la información del ID proporcionado **sin filtrar por `status`** del niño (5).
- **Sí:** mapear campos y formatos según lo acordado: `full_name`, edad desde `birth_date`, sala desde `rooms.name` (o "Sin sala"), `birth_date`/`enrolled_at` formateadas en español, alergias/notas desde `medical_notes`/`allergy_tags` cuando existan, identidad visual determinística (2.a).
- **Sí:** considerar "padre relacionado" a los vínculos en `parent_children` (join `users`) y traducir `relationship` a Padre/Madre/Tutor en español; mostrar mensaje explícito cuando no haya vínculos (3.a).
- **Sí:** mantener el botón "Vincular otro padre" siempre visible con el mismo comportamiento UI de SPEC 05, sin persistencia (4.a).
- **Sí:** mantener fuera de alcance edición, persistencia de vínculos/invitaciones, invitaciones pendientes, cambios en `/kids`, migraciones/RLS y pruebas automatizadas.
- **No:** filtrar el perfil por `status = 'active'`.
- **No:** implementar envío real, creación de invitaciones o cambios de base de datos desde el modal.
- **No:** mostrar invitaciones pendientes de `invitations` como padres vinculados.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El `id` de ruta no es un UUID válido o no existe en BD. | Manejar resultado vacío mostrando "Perfil no encontrado"; no asumir forma del ID más allá de usarlo en la búsqueda. |
| `room_id` es nulo o la relación de sala no devuelve nombre. | Mostrar valor por defecto en UI ("Sin sala") sin bloquear el render del perfil. |
| Formatos de fecha/edad inconsistentes o valores nulos inesperados. | Reutilizar utilidades existentes, formatear con reglas consistentes y definir fallback seguro si falta un campo. |
| `parent_children` o el join con `users` falla por permisos/RLS o datos incompletos. | Tratar error como estado de carga fallida con mensaje en español; mapear solo vínculos con datos mínimos disponibles. |
| Cambios en componentes compartidos (`KidParentsCard`/`KidParentsSection`) afectan otros usos. | Ajustar props/comportamiento de forma compatible y verificar `/kids` y el perfil tras el refactor. |
| `allergy_tags`/`medical_notes` con contenido variable. | Renderizar de forma defensiva solo cuando haya contenido, priorizando texto claro. |

## Lo que **no** está en esta spec

- Edición del perfil del niño y acciones reales de "Editar" o "Resumen del día".
- Persistencia de vínculos padre-niño, gestión real de invitaciones, envío de correos o cambios en BD desde el modal.
- Visualización de invitaciones pendientes como padres vinculados.
- Cambios en la pantalla de listado `/kids` (datos, búsqueda, filtros o agrupación).
- Migraciones, cambios de esquema, RLS/policies, triggers o carga de datos seed.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, irá en su propia spec.
