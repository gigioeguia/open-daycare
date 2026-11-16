# SPEC 10 — Listado de niños desde BD con búsqueda

> **Estado:** Implementado  
> **Depende de:** SPEC 02, SPEC 07, SPEC 09  
> **Fecha:** 2026-11-15  
> **Objetivo:** Conectar la pantalla de listado `/kids` a datos reales de `children`/`rooms` en Supabase y habilitar búsqueda por nombre de niño desde esa página.

## 1. Por qué existe esta spec

El listado de niños (`/kids`) implementado en SPEC 02 renderiza información ficticia y un buscador visual sin funcionalidad. Esta spec lleva esa pantalla a datos reales de base de datos y activa el filtrado por nombre, manteniendo la estructura visual existente y sin ampliar el alcance a padres ni al perfil `/kids/[id]`.

## Alcance

**Incluye:**

- Consultar y renderizar en `app/kids/page.tsx` niños reales desde `public.children` con contexto de `public.rooms` (join por `room_id`) para la agrupación, reemplazando el origen ficticio del listado (`kidsPageData`/`kids` estáticos) en esta pantalla.
- Criterios de consulta: solo registros con `children.status = 'active'` y `children.room_id IS NOT NULL` (los niños sin sala no se muestran).
- Agrupación visual: una sección por sala usando `rooms.name`, con conteo real de niños mostrados en cada sección (según el resultado de la consulta/búsqueda).
- Búsqueda funcional por nombre en `/kids` mediante query param `?q=` resuelto en servidor:
  - Coincidencia parcial tipo “contiene” sobre `children.full_name`.
  - Sin distinguir mayúsculas/acentos.
  - Filtrado al cambiar el valor del campo de búsqueda (input sincronizado con `?q=`; actualización de URL con `router.replace` y debounce recomendado de ~300 ms para evitar navegación excesiva). El término buscado se mantiene en el input vía `?q=`.
- Mapeo de UI del listado:
  - `name`: `children.full_name`.
  - `ageLabel`: calculado desde `children.birth_date` (años cumplidos, en español, p. ej. “2 años”, “3 años”).
  - Subtítulo de tarjeta: texto fijo **"Sin información de padres"** (no se consulta `parent_children`).
  - `initial`: primera letra relevante de `full_name`; avatar/color determinísticos según `full_name` (consistentes para el mismo nombre), preservando el estilo visual de `KidCard`/`Avatar`.
  - Sala/sección: `rooms.name`.
- Estados simples dentro del layout actual de `/kids`:
  - (a) Sin niños: “No hay niños para mostrar.”
  - (b) Búsqueda sin resultados: “No se encontraron niños para \”{q}\”.” (donde `{q}` es el término buscado).
  - (c) Error de carga desde Supabase: “No pudimos cargar los niños. Intenta nuevamente.”
- Preparación/validación de datos dummy en BD para comprobar la pantalla: 1 guardería, 2 salas (“Sala Soles”, “Sala Lunas”) y 3 niños activos, todos asignados a sala, con al menos 1 niño que incluya `allergy_tags` de ejemplo en BD. **No se renderizan badges de alergia en esta spec** (los `allergy_tags` se persisten solo como dato de prueba para una spec futura).
- Ajustes necesarios en `app/kids/page.tsx` y componentes de `app/components/kids/` (p. ej. `KidsSearchInput`, `KidsRoomSection`, `KidCard` y/o módulo de acceso a datos) para soportar datos reales, agrupación por sala y búsqueda, manteniendo el shell y la apariencia general.

**Fuera de alcance (para futuras specs):**

- Conectar a BD o modificar la lógica/visual del perfil `app/kids/[id]/page.tsx` (permanece con datos ficticios).
- Relaciones con padres/tutores (`parent_children`, usuarios padre, invitaciones) y conteo real de padres vinculados.
- Exposición/renderizado de badges o UI de alergias/notas médicas (`allergy_tags`, `medical_notes`) en el listado.
- Alta, edición, archivado o eliminación de niños/salas desde la UI.
- Migraciones nuevas, cambios de esquema, RLS/policies, triggers o modificaciones a la BD existente (salvo resolución de bloqueos detectados, que se documentarían).
- Paginación, ordenamiento configurable, filtros adicionales desde UI (por sala/estado) o búsqueda por campos distintos de `full_name`.
- Pruebas automatizadas.

## Modelo de datos

No se introducen tablas ni columnas nuevas. Se utilizan estructuras existentes (SPEC 07 / `07-DB-Schema/opendaycare-database-schema.md`):

- **`public.daycares`**: `id uuid`, `name text`, `created_at timestamptz`.
- **`public.rooms`**: `id uuid`, `daycare_id uuid` (FK `daycares`), `name text`, `created_at timestamptz`.
- **`public.children`**: `id uuid`, `room_id uuid` nullable (FK `rooms`), `full_name text`, `birth_date date`, `enrolled_at date`, `medical_notes text`, `allergy_tags text[]`, `photo_consent boolean`, `status public.child_status` (`active`/`archived`), `created_at timestamptz`, `updated_at timestamptz`.

**Datos dummy propuestos (para poblar/validar el listado):**

- **Daycare (1):** `name = 'Guardería OpenDayCare'` (reutilizar si ya existe un registro equivalente; si no, crear uno).
- **Rooms (2):** asociadas a la daycare anterior:
  - R1: `name = 'Sala Soles'`
  - R2: `name = 'Sala Lunas'`
- **Children (3), todos `status = 'active'`, `room_id` asignado, `photo_consent = true`:**
  - C1: `full_name = 'Mateo Fernández'`, `birth_date = '2022-03-12'`, `enrolled_at = '2025-02-10'`, `room = Sala Soles`, `allergy_tags = ARRAY['peanut']::text[]`, `medical_notes = 'Alergia al maní (dato de prueba).'`
  - C2: `full_name = 'Sofía Méndez'`, `birth_date = '2023-07-04'`, `enrolled_at = '2025-03-03'`, `room = Sala Soles`, `allergy_tags = NULL`, `medical_notes = NULL`
  - C3: `full_name = 'Lucas Romero'`, `birth_date = '2022-02-02'`, `enrolled_at = '2025-02-18'`, `room = Sala Lunas`, `allergy_tags = NULL`, `medical_notes = NULL`

> Los `id`/`daycare_id` concretos se resolverán en implementación (usar existentes o generar). Las fechas son de ejemplo para validar edad y agrupación. `allergy_tags` de C1 existe en BD pero no genera badge en UI en esta spec.

**Modelo de UI derivado (solo listado `/kids`):**

- Ítem de niño: `id`, `name` (`full_name`), `ageLabel` (derivado de `birth_date`), `linkedParentsLabel = "Sin información de padres"`, `initial`, colores/avatar determinísticos por `full_name`, `roomName` (para agrupar/mostrar sección).
- Sin campos de badge de alergia renderizados en esta spec.

## Plan de implementación

1. **Validar tablas y preparar datos dummy.** Confirmar que `public.rooms` y `public.children` existen y coinciden con la migración/schema. Verificar/crear 1 daycare, 2 salas (“Sala Soles”, “Sala Lunas”) y 3 niños activos con `room_id` asignado (incluido 1 con `allergy_tags` de ejemplo). Verificación: consulta manual devuelve los 3 niños activos con su sala.
2. **Implementar lectura de datos para `/kids`.** Crear función(es) de acceso en servidor usando `utils/supabase/server.ts` (y/o módulo de datos de kids) que obtengan niños `active` con `room_id` no nulo junto a `rooms.name`, aceptando `q` opcional para filtrar por `full_name` con coincidencia parcial e insensible a mayúsculas/acentos. Verificación: sin `q` retorna los 3 niños; con `q` filtra correctamente (incluyendo nombres con acentos).
3. **Derivar campos de presentación.** Implementar/utilizar utilidades para calcular `ageLabel` (años cumplidos) desde `birth_date` y generar inicial/color-avatar determinísticos desde `full_name`; fijar `linkedParentsLabel = "Sin información de padres"`. Verificación: valores consistentes y estables entre renderizados.
4. **Conectar UI de `/kids` y búsqueda.** Actualizar `app/kids/page.tsx` para leer `searchParams.q`, cargar datos reales agrupados por sala (con conteo) y renderizar estados (vacío/sin resultados/error). Adaptar `KidsSearchInput` a input funcional sincronizado con `?q=` (debounce recomendado ~300 ms, `router.replace`) y ajustar `KidsRoomSection`/`KidCard` al nuevo modelo sin badges de alergia. Verificación manual: `/kids` muestra datos reales, agrupa por sala y filtra al escribir.
5. **Validación y no regresión.** Confirmar que `/kids/[id]` sigue operando con datos ficticios y que el resto del flujo de `/kids` no depende de datos estáticos removidos. Verificación: `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores; comprobación manual de `/kids` (listado, búsqueda, estados).

## Criterios de aceptación

- [x] `app/kids/page.tsx` muestra en `/kids` niños obtenidos desde `public.children` con sala desde `public.rooms` (datos reales), no desde la fuente ficticia del listado.
- [x] Solo se listan niños con `children.status = 'active'` y `children.room_id IS NOT NULL`.
- [x] El contenido se agrupa en secciones por `rooms.name` y cada sección muestra el conteo real de niños.
- [x] Cada tarjeta muestra `full_name`, `ageLabel` calculado desde `birth_date`, inicial/avatar-color determinísticos según `full_name`, y el texto **"Sin información de padres"**; no se renderizan badges de alergia.
- [x] El buscador de `/kids` filtra por `full_name` usando `?q=` en servidor, con coincidencia parcial “contiene” sin distinguir mayúsculas/acentos, y se actualiza al cambiar el valor (término reflejado en `?q=`).
- [x] Se muestran mensajes simples dentro del layout para: (a) “No hay niños para mostrar.”, (b) “No se encontraron niños para \”{q}\”.” cuando no hay resultados de búsqueda, (c) “No pudimos cargar los niños. Intenta nuevamente.” ante error de carga.
- [x] Existen datos dummy para validación: 1 guardería, 2 salas (“Sala Soles”, “Sala Lunas”) y 3 niños activos asignados a sala, incluyendo al menos 1 con `allergy_tags` de ejemplo en BD.
- [x] `app/kids/[id]/page.tsx` conserva su comportamiento actual basado en datos ficticios sin regresiones.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores.

## Decisiones

- **Sí:** integrar BD solo en `/kids` (listado); `/kids/[id]` queda fuera de alcance.
- **Sí:** filtrar por `status = 'active'` y `room_id IS NOT NULL`; agrupar por sala real (`rooms.name`) con conteo.
- **Sí:** mostrar “Sin información de padres” y omitir consultas a `parent_children`/padres.
- **Sí:** búsqueda server-side con `?q=` (contiene, case/acento-insensible), sincronizada al cambiar el valor (debounce recomendado ~300 ms con `router.replace`).
- **Sí:** edad calculada desde `birth_date` (años cumplidos) e identidad visual (inicial/color) determinística por `full_name`.
- **Sí:** poblar datos dummy (1 daycare, 2 rooms, 3 children activos) para validación; C1 incluye `allergy_tags` en BD pero la UI de alergias/badges se difiere a otra spec.
- **No:** renderizar badges/alergias, conectar `/kids/[id]` a BD, CRUD de niños/salas, migraciones/RLS/cambios de esquema, paginación o pruebas automatizadas.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| No existe `daycare`/datos previos o se desconoce `daycare_id` para insertar salas dummy. | Reutilizar registros existentes cuando aplique; si no, crear 1 daycare y asociar las 2 salas como parte de la preparación de datos documentada. |
| La comparación acento-insensible por nombre puede depender del soporte de la consulta/BD. | Implementar una estrategia explícita y portable (p. ej. normalización/unaccent o filtro equivalente) y validar con “Sofía/Mateo/Lucas”. |
| `app/kids/[id]/page.tsx` depende de `kids-data.ts`/tipos usados hoy por el listado. | Mantener compatibilidad del módulo de datos para el perfil o aislar la fuente de datos del listado sin romper `/kids/[id]`. |
| El cálculo de edad puede variar por borde de fecha/zona horaria. | Usar una regla simple y consistente de años cumplidos basada en la fecha de referencia del servidor. |
| Convertir el buscador de visual (`readOnly`) a funcional puede introducir regresiones de estilo/UX. | Limitar cambios a comportamiento y estado del input, preservando clases/estructura visual existentes. |

## Lo que **no** está en esta spec

- Perfil de niño `/kids/[id]` con datos de BD.
- Conteo/enlace real de padres, `parent_children`, invitaciones o usuarios padre.
- Badges/visualización de alergias o notas médicas en el listado.
- Alta, edición o borrado de niños/salas desde la UI.
- Nuevas migraciones, RLS, policies o cambios de esquema de BD.
- Paginación, ordenamiento avanzado o filtros adicionales.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, irá en su propia spec.
