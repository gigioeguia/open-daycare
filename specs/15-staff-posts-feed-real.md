# SPEC 15 — Publicaciones de staff en feed real (con y sin imágenes)

> **Estado:** Implementado  
> **Depende de:** SPEC 01, SPEC 06, SPEC 07, SPEC 09, SPEC 10  
> **Fecha:** 2026-11-16  
> **Objetivo:** Implementar la creación, edición y eliminación de publicaciones por `staff`/`admin` desde la sala actual, con persistencia real en Supabase (posts, destinatarios e imágenes privadas en Storage) y visualización del feed `/` con datos reales según rol y visibilidad.

## 1. Por qué existe esta spec

La UI de “Nueva publicación” (SPEC 06) y el feed home (SPEC 01) funcionan con datos ficticios y sin persistencia. Esta spec convierte ese flujo en una funcionalidad real: las publicaciones se guardan en base de datos, pueden incluir imágenes opcionales almacenadas de forma privada, respetan aislamiento por guardería/sala y reglas de visibilidad, y se reflejan en un feed real para `staff`, `admin` y `parent`.

## Alcance

**Incluye:**

- **Persistencia real en Supabase (BD):** crear, editar y eliminar publicaciones de sala usando tablas alineadas a `@db-schema/opendaycare-database-schema.md`, con las extensiones necesarias para este alcance:
  - `public.posts` (autor, sala actual, tipo, texto, publicación/fechas, `daycare_id` para multi-tenant).
  - `public.post_children` (niños etiquetados, PK compuesta).
  - `public.post_photos` (fotos asociadas, orden/metadata mínima necesaria).
  - Extensión del enum `public.post_type` para incluir `mood` (`Ánimo`) además de `meal`, `nap`, `activity`, `achievement`, `photo`, `announcement`.
- **Migraciones SQL versionadas** en `supabase/migrations/` para: enum/tabla(s) de posts y relaciones, columnas/índices/FKs necesarias (incluido `daycare_id` y claves de consulta), y **RLS/policies** de lectura/escritura coherentes con los permisos definidos. Incluye migración de corrección de recursión RLS (`20261116230000_fix_posts_rls_recursion.sql`) que introduce funciones auxiliares `SECURITY DEFINER` (`public.can_manage_post`, `public.can_view_post`) para evaluar permisos/visibilidad sin ciclos entre `posts`, `post_children` y `post_photos`.
- **Supabase Storage (imágenes privadas):** uso de un bucket privado (p. ej. `post-images`) con policies que impidan acceso público directo y permitan operaciones solo a usuarios autorizados según guardería/rol/visibilidad. Las imágenes del feed se consumen mediante **URLs firmadas** generadas al leer/servir los datos (renovables).
- **Permisos y aislamiento (multi-tenant):**
  - **Crear:** solo usuarios con rol `staff` o `admin` autenticados y pertenecientes a la misma `daycare_id`.
  - **Leer:**
    - `staff`/`admin`: publicaciones de su guardería en el contexto de sala/feed actual.
    - `parent`: publicaciones que etiquetan a **sus hijos vinculados** (`post_children` ↔ `parent_children`) y/o publicaciones `announcement` de **su sala** (`room_id`). Un padre no ve posts fuera de su lugar salvo los vinculados explícitamente a sus hijos.
  - **Editar y eliminar:** `staff`/`admin` de la **misma guardería** (mismo criterio para ambas acciones).
  - Todo acceso/operación aislado por `daycare_id`.
- **Flujo de creación desde sala/feed actual (`/`, disparador `+ Nueva publicación` del sidebar):** evolución del modal de SPEC 06 para operar con datos y reglas reales:
  - Destinatarios reales: selección de **uno o varios niños** de **cualquier sala de la guardería** o **“Toda la sala”** (sala actual), con regla **excluyente** (igual que SPEC 06: elegir “Toda la sala” desmarca individuos y viceversa).
  - Tipos reales: `Comida` (`meal`), `Siesta` (`nap`), `Actividad` (`activity`), `Logro` (`achievement`), `Ánimo` (`mood`), `Foto` (`photo`), `Anuncio` (`announcement`), selección única.
  - Descripción obligatoria (`body`): `trim().length >= 10` y `<= 1000` caracteres; se permiten letras, números, espacios/saltos de línea, puntuación, emojis y URLs (sin la restricción de “solo letras/sin números” de SPEC 06).
  - Imágenes opcionales (0–N): selector de archivos con preview y opción de quitar antes de publicar; formatos permitidos **JPEG/JPG, PNG, WEBP**; máximo **5** imágenes por publicación; máximo **2 MB** por imagen; máximo **10 MB** total. El tipo `Foto` **no** exige imagen obligatoria.
  - Estados de UI: carga, deshabilitar doble envío, errores por campo/sección y errores generales claros en español; preservación de valores ante error cuando sea viable.
  - Éxito: cierre y reseteo del modal y actualización del feed real (revalidación/refresh desde servidor y/o feedback inmediato de éxito/optimista según implementación).
- **Atomicidad y consistencia (crear/editar):** si falla la creación/actualización o la subida/asociación de imágenes, la operación se **cancela por completo** sin dejar publicación/fotos huérfanas ni archivos huérfanos en Storage. Estrategia acordada: subir imágenes a Storage primero y, si falla el insert/update en BD, eliminar los archivos subidos (rollback best-effort en aplicación), con manejo de errores explícito.
- **Diagnóstico de errores en mutaciones:** las Server Actions de posts registran en servidor (`console.error`) el detalle de fallos de subida/guardado (p. ej. error de Storage o BD) y devuelven mensajes de error con causa técnica cuando está disponible, para facilitar depuración sin exponer secretos.
- **Límite de payload en Server Actions:** configuración de `experimental.serverActions.bodySizeLimit` en `next.config.ts` (12 MB) para soportar envíos con imágenes dentro de los límites de la spec (hasta 10 MB total + overhead de formulario), evitando errores `Body exceeded 1 MB limit`.
- **Edición de publicaciones:** permitir a `staff`/`admin` de la misma guardería modificar una publicación existente (tipo, descripción, destinatarios y sala/contexto aplicable) y **agregar/quitar imágenes**, revalidando reglas, formatos y límites (5 imágenes, 2 MB c/u, 10 MB total).
- **Eliminación de publicaciones:** permitir a `staff`/`admin` de la misma guardería eliminar una publicación, borrando sus relaciones/fotos en BD (`post_children`, `post_photos`) y los **archivos correspondientes en Storage**.
- **Feed real en `/` (`app/page.tsx` y componentes de `app/components/feed/`):** reemplazar el origen ficticio por consultas reales a Supabase respetando rol y visibilidad:
  - `staff`/`admin`: publicaciones de la **sala actual** ordenadas por `published_at` descendente.
  - `parent`: publicaciones de sus **hijos vinculados** + `announcement` de **su sala**, ordenadas por `published_at` descendente.
  - Render de contenido real (autor, fecha/hora, tipo/etiqueta, destinatario/audiencia, texto, imágenes con URL firmada cuando aplique) manteniendo fidelidad visual razonable con la UI existente.
- **Semántica de “Toda la sala” (sala actual):** al publicar para toda la sala actual se crea un post de tipo/audiencia de sala sin filas en `post_children`, con `room_id` de la sala actual (alineado al modelo de anuncios por sala). `posts.room_id` representa siempre la **sala/feed actual desde donde se publica**.
- **Visibilidad por vínculo hijo (cruce de salas):** si un post creado en la sala actual etiqueta a un niño de otra sala de la guardería, el padre vinculado a ese niño **sí ve** el post; otros padres de esa otra sala no vinculados a ese niño no lo ven.
- **Ajustes de código/UI necesarios:** componentes, tipos, validaciones y utilidades en `app/components/feed/` (p. ej. `CreatePostModal.tsx`, `create-post-form.ts`, `FeedShell.tsx`, tarjetas/listado), Server Actions/rutas o módulos de datos en `app/`/`utils/supabase/` para lectura/escritura, manejo de Storage firmado y refresco del feed, manteniendo convenciones del proyecto (código en inglés, UI en español).

**Fuera de alcance (para futuras specs):**

- Reacciones, comentarios, contadores reales y acciones sociales del feed.
- Borradores, programación de publicaciones, historial de versiones o auditoría avanzada.
- Notificaciones push/email al publicar, preferencias de notificación o resumen diario automático.
- Recorte/edición avanzada de imágenes, compresión obligatoria en servidor, CDN propio o transformación de imágenes más allá de lo necesario para mostrar/firmar.
- Filtros avanzados del feed, paginación infinita, búsqueda de publicaciones o vistas de detalle dedicadas.
- Cambios de UX/negocio no descritos en invitaciones, perfil de niños/padres o alta de niños/salas.
- Pruebas automatizadas E2E/unitarias (se contempla verificación manual y técnica).

## Modelo de datos

**Base:** `@db-schema/opendaycare-database-schema.md` (PostgreSQL/Supabase, `uuid`, `timestamptz`, valores persistidos en inglés).

### Tablas y estructuras (existentes/extendidas)

**`public.posts` (publicaciones)**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | `gen_random_uuid()` |
| `daycare_id` | `uuid` FK → `public.daycares(id)` | **Extensión** multi-tenant (obligatorio, indexado). |
| `author_id` | `uuid` FK → `public.users(id)` | Autor autenticado (`staff`/`admin`). |
| `room_id` | `uuid` FK → `public.rooms(id)` | Sala/feed actual desde donde se publica. Nullable solo si el modelo lo requiere; para este alcance se usa como sala actual del post/anuncio. |
| `type` | `public.post_type` | `meal` \| `nap` \| `activity` \| `achievement` \| `mood` \| `photo` \| `announcement`. |
| `title` | `text` | Nullable (opcional; no requerido por UI actual). |
| `body` | `text` | Descripción obligatoria (10–1000 caracteres tras trim en validación de app). |
| `published_at` | `timestamptz` | Fecha/hora efectiva de publicación (para orden del feed). |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Default/actualización en cambios. |

**`public.post_children` (niños etiquetados)**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `post_id` | `uuid` FK → `public.posts(id)` ON DELETE CASCADE |  |
| `child_id` | `uuid` FK → `public.children(id)` ON DELETE CASCADE |  |
|  |  | PK compuesta (`post_id`, `child_id`). Sin filas cuando el post es “Toda la sala”. |

**`public.post_photos` (fotos de publicación)**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` PK | `gen_random_uuid()` |
| `post_id` | `uuid` FK → `public.posts(id)` ON DELETE CASCADE |  |
| `storage_path` | `text` | Ruta/objeto en bucket privado (fuente para firmar/borrar). |
| `mime_type` | `text` | `image/jpeg`, `image/png`, `image/webp`. |
| `size_bytes` | `int`/`bigint` | Tamaño del archivo (validación/límites). |
| `position` | `int` | Orden de visualización (0..N-1). |
| `width` / `height` | `int` | Nullable (opcional). |
| `created_at` | `timestamptz` | Default `now()`. |

> Nota: `@db-schema` referencia `url` en `post_photos`; esta spec permite adaptar a `storage_path` (+ URL firmada derivada) para Storage privado. La migración debe documentar/normalizar el campo elegido y mantener consistencia con el código.

**Enum `public.post_type`**

- Valores finales esperados: `meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement`.

### Storage

- **Bucket:** privado, nombre propuesto `post-images` (ajustable si el proyecto ya define convención, manteniendo privacidad).
- **Objeto:** asociado a `daycare_id`/`post_id`/identificador único para trazabilidad y borrado.
- **Acceso:** sin lectura pública; operaciones vía cliente autenticado con policies y/o servicio controlado, y lectura en UI mediante **URLs firmadas** de duración limitada.

### Modelos/contratos de aplicación (orientativos)

```ts
// app/components/feed/create-post-form.ts (evolución)
export type PostAudienceMode = "children" | "room";
export type PostTypeId =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export type CreatePostFormValues = {
  audienceMode: PostAudienceMode; // "room" => Toda la sala (excluyente)
  childIds: string[]; // UUIDs de children cuando audienceMode === "children"
  typeId: PostTypeId | "";
  description: string; // body, 10..1000 chars tras trim
  images: File[]; // 0..5, jpg/jpeg/png/webp, <=2MB c/u, <=10MB total
};

export type PostImageInput = {
  storagePath: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  position: number;
};
```

```ts
// Resultado orientativo de Server Action (crear/editar)
export type PostMutationResult =
  | { ok: true; postId: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        audience?: string;
        type?: string;
        description?: string;
        images?: string;
      };
    };
```

## Plan de implementación

1. **Migraciones de BD y enum (`supabase/migrations/`).** Crear migración(es) para: agregar `mood` a `public.post_type` (si no existe), crear/extender `public.posts`, `public.post_children`, `public.post_photos` con FKs/índices (`daycare_id`, `room_id`, `author_id`, `published_at`, relaciones de fotos/etiquetas) y constraints coherentes; asegurar borrado en cascada de relaciones/fotos al eliminar un post.  
   _Verificación:_ migración aplica sin errores y el esquema refleja tablas, enum y relaciones requeridas.

2. **RLS y aislamiento multi-tenant (BD).** Definir policies para `posts`, `post_children`, `post_photos` que permitan: crear/editar/eliminar a `staff`/`admin` de la misma `daycare_id`; leer a `staff`/`admin` de su guardería/sala según contexto y a `parent` solo posts con hijos vinculados (`parent_children`) o `announcement` de su sala; impedir acceso cruzado entre guarderías.  
   _Verificación:_ consultas con usuarios de distintos roles/guarderías respetan visibilidad y permisos.  
   _Ajuste aplicado:_ agregar migración de corrección (`20261116230000_fix_posts_rls_recursion.sql`) con funciones auxiliares `SECURITY DEFINER` (`can_manage_post`, `can_view_post`) y policies actualizadas para evitar recursión RLS entre `posts`, `post_children` y `post_photos`.

3. **Bucket y policies de Storage privado.** Crear/configurar bucket `post-images` (privado) y policies de Storage para subida/lectura/borrado restringidas a usuarios autorizados del `daycare_id`/post; definir convención de `storage_path`. Implementar generación de **URLs firmadas** al obtener datos del feed/detalle necesario para render de imágenes.  
   _Verificación:_ no hay acceso público; usuarios autorizados ven imágenes mediante URL firmada y operaciones no autorizadas fallan.

4. **Capa de datos y Server Actions de posts (`app/` y/o `utils/supabase/`).** Implementar funciones/acciones tipadas para: listar feed real por rol y sala actual (orden `published_at desc`, con autor, audiencia, fotos firmadas), crear post, editar post y eliminar post. Incluir validaciones servidoras (rol, guardería/sala, destinatarios válidos, tipo, descripción 10–1000, límites de imágenes/formatos/tamaños) y resolución de “Toda la sala” vs niños etiquetados. Registrar en servidor y exponer mensajes claros con detalle técnico disponible ante fallos de Storage/BD para facilitar depuración.  
   _Verificación:_ mutaciones válidas persisten correctamente; mutaciones inválidas/no autorizadas devuelven errores claros sin efectos parciales.

5. **Flujo de subida y rollback best-effort (Storage↔BD).** Implementar creación/edición con estrategia: validar entrada, subir nuevos archivos a Storage, persistir cambios en BD y, ante fallo posterior, eliminar archivos recién subidos. En eliminación, borrar archivos de Storage asociados tras/según estrategia segura y limpiar registros en BD; en edición, al quitar imágenes borrar sus objetos de Storage y filas en `post_photos`.  
   _Verificación:_ fallos simulados no dejan registros huérfanos ni objetos huérfanos; eliminar/editar refleja estado final consistente.

6. **Modal de creación/edición con datos reales (`app/components/feed/CreatePostModal.tsx`, `create-post-form.ts`).** Adaptar formulario y validaciones cliente: destinatarios reales (niños de cualquier sala de la guardería + “Toda la sala” excluyente), tipos con `Ánimo/mood`, descripción 10–1000 con caracteres comunes/emojis/URLs, selección de imágenes (0–5, jpg/jpeg/png/webp, 2 MB c/u, 10 MB total) con preview/quitar, estados de carga/disabled y mensajes de error en español. Reutilizar modal/flujo para editar cuando corresponda (precarga de datos e imágenes existentes con posibilidad de agregar/quitar).  
   _Verificación:_ validaciones y UX funcionan en crear y editar; no se permite doble envío.

7. **Integración en feed real (`app/page.tsx`, `FeedShell.tsx`, componentes de posts/feed).** Conectar `/` a datos reales según rol (`staff/admin` sala actual; `parent` hijos vinculados + anuncios de su sala), renderizar publicaciones con metadatos e imágenes firmadas, y refrescar lista al crear/editar/eliminar (éxito con cierre/reset del modal y actualización visible). Ajustar copy/estructura de shell (sala/contexto real) donde sea necesario sin romper layout responsive.  
   _Verificación:_ el feed muestra solo publicaciones permitidas por rol/visibilidad y se actualiza tras mutaciones.

8. **Controles de editar/eliminar en UI y verificación técnica final.** Exponer acciones de editar/eliminar para `staff/admin` de la misma guardería en las publicaciones aplicables, con confirmación de eliminación y manejo de errores. Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`. Realizar verificación manual de escenarios clave (crear con/sin imágenes, toda la sala, niño de otra sala, visibilidad padre, editar agregando/quitando imágenes, eliminar con borrado en Storage).  
   _Verificación:_ lint, typecheck y build en verde; flujos manuales cumplen criterios.

## Criterios de aceptación

- [x] Existen migraciones en `supabase/migrations/` que crean/extienden `public.posts`, `public.post_children`, `public.post_photos`, incluyen `mood` en `public.post_type` y agregan aislamiento multi-tenant por `daycare_id` con FKs/índices/RLS/policies necesarias: `20261116130000_create_posts_schema.sql`, `20261116133000_create_posts_rls.sql`, `20261116140000_create_post_images_storage.sql`, `20261116230000_fix_posts_rls_recursion.sql`. Aplicadas y verificadas en el proyecto Supabase conectado (pruebas manuales OK).
- [x] Existe configuración de Storage privada para imágenes de posts (bucket/policies) y el sistema no expone imágenes públicamente; el feed consume imágenes mediante URLs firmadas. Bucket `post-images` creado y verificado en Supabase (privado, 2 MB, JPEG/PNG/WEBP) con policies de `storage.objects` (pruebas manuales OK).
- [x] Un usuario `staff` o `admin` autenticado de una guardería puede **crear** una publicación desde la sala actual con: tipo válido, descripción de 10–1000 caracteres (permite números/saltos/emojis/URLs), y destinatario **“Toda la sala”** (excluyente, sin `post_children`) o 1+ niños de cualquier sala de la guardería (con `post_children`). Implementado en `app/feed/actions.ts` (`createPostAction`) y modal `CreatePostModal.tsx`; verificado manualmente.
- [x] La creación permite **0 a 5** imágenes opcionales (JPEG/JPG, PNG, WEBP; máx. 2 MB por imagen; máx. 10 MB total), muestra preview/quitar antes de publicar, y el tipo `Foto` no obliga a adjuntar imagen. Implementado en `CreatePostModal.tsx` + `create-post-form.ts` con validaciones cliente/servidor; verificado manualmente.
- [x] Si ocurre un error durante la creación (BD o subida de imágenes), la operación se cancela por completo sin dejar post/fotos en BD ni archivos huérfanos en Storage; la UI muestra error y evita doble envío. Implementado con rollback best-effort en `createPostAction`/`updatePostAction` (`cleanupUploadedPaths`, reversión de inserciones parciales).
- [x] `posts.room_id` corresponde siempre a la sala/feed actual desde donde se publica. Un padre vinculado a un niño etiquetado ve el post aunque el niño sea de otra sala; otros padres de esa otra sala no vinculados no lo ven. Padres de otras salas no ven posts fuera de lugar. Implementado en modelo/acciones, consultas de feed (`utils/supabase/feed.ts`) y RLS/policies con `can_view_post` (`20261116230000_fix_posts_rls_recursion.sql`); verificado manualmente (cruce de salas, anuncios de sala, visibilidad por rol y aislamiento entre guarderías `daycare_id`).
- [x] El feed `/` muestra datos reales desde Supabase ordenados por `published_at` desc: `staff/admin` ven publicaciones de la sala actual; `parent` ve publicaciones de sus hijos vinculados y `announcement` de su sala. La UI renderiza autor, tipo/audiencia, texto e imágenes (vía URL firmada) cuando existentes. Implementado en `app/page.tsx`, `utils/supabase/feed.ts` y componentes de feed; verificado manualmente por rol.
- [x] Un `staff`/`admin` de la misma guardería puede **editar** una publicación (tipo, descripción, destinatarios y agregar/quitar imágenes) respetando validaciones y límites, y puede **eliminarla** borrando sus datos en BD y sus archivos en Storage. Implementado en `updatePostAction`/`deletePostAction` y controles UI (`PostCard`/`PostActions`); verificado manualmente, incluyendo borrado efectivo de archivos en Storage.
- [x] En éxito de crear/editar/eliminar, el usuario recibe feedback claro y el feed se actualiza (cierre/reset del modal en crear/editar y refresco/actualización visible de la lista). Implementado con `revalidatePath("/")` y cierre/reseteo del modal en `CreatePostModal.tsx`; verificado manualmente.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores. Verificado en ejecución (0 errores; 3 warnings `@next/next/no-img-element` en `CreatePostModal.tsx` y `PostCard.tsx`). `next.config.ts` actualizado con `experimental.serverActions.bodySizeLimit` (12 MB) para soportar publicaciones con imágenes.

## Decisiones

- **Sí:** persistencia real con Supabase (BD + Storage privado) y feed real en `/` por rol/visibilidad.
- **Sí:** nueva spec que evoluciona SPEC 01/06 (de mock a real) manteniendo la entrada principal desde `+ Nueva publicación` en sala/feed actual.
- **Sí:** solo `staff` y `admin` crean/editan/eliminan; padres solo lectura según visibilidad (hijos vinculados y/o anuncio de su sala).
- **Sí:** alcance de sala actual (`posts.room_id` = sala/feed de publicación) y destinatarios con niños de cualquier sala de la guardería o “Toda la sala” excluyente.
- **Sí:** visibilidad por vínculo hijo-publicación aunque haya cruce de salas (padre vinculado al niño etiquetado sí ve; otros padres de esa sala no).
- **Sí:** tipos `Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio` con extensión de `post_type` para incluir `mood`.
- **Sí:** descripción 10–1000 caracteres permitiendo contenido común (números, saltos de línea, emojis, URLs); tipo `Foto` sin imagen obligatoria.
- **Sí:** imágenes opcionales 0–5 (JPEG/JPG, PNG, WEBP), 2 MB por imagen y 10 MB total, privadas con URLs firmadas.
- **Sí:** atomicidad “cancelar todo” ante fallos con rollback best-effort (subir primero y limpiar Storage si falla BD; consistencia en editar/eliminar).
- **Sí:** incluir edición y eliminación en alcance, con borrado de archivos en Storage al eliminar/quitar imágenes.
- **Sí:** aislamiento multi-tenant por `daycare_id`, aceptando extensiones al `@db-schema` (p. ej. `posts.daycare_id`, `post_photos.storage_path`) cuando sean necesarias para RLS/operación.
- **Sí:** resolver recursión RLS entre `posts`/`post_children`/`post_photos` mediante funciones auxiliares `SECURITY DEFINER` (`can_manage_post`, `can_view_post`) y policies basadas en ellas (migración de corrección).
- **Sí:** registrar en servidor y propagar mensajes de error con detalle técnico disponible en mutaciones de posts para facilitar depuración.
- **Sí:** ampliar `experimental.serverActions.bodySizeLimit` (12 MB) en `next.config.ts` para permitir publicaciones con imágenes según los límites definidos.
- **No:** reacciones/comentarios reales, borradores, notificaciones, paginación/filtros avanzados o pruebas automatizadas en esta spec.
- **No:** acceso público a imágenes ni publicación por usuarios con rol `parent`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Fugas de visibilidad entre salas/guarderías por RLS o consultas incorrectas. | Policies y consultas explícitas por `daycare_id`, `room_id`, `post_children` y `parent_children`; validar escenarios (staff/admin/parent, cruce de salas, anuncio de sala). |
| Archivos huérfanos en Storage o registros huérfanos en BD ante fallos parciales. | Flujo compensatorio definido (subir→persistir→limpiar en fallo), manejo de errores y verificación en editar/eliminar/quitar imágenes. |
| URLs firmadas expiran y afectan render/caching de imágenes. | Generar firmas al leer datos del feed con vigencia adecuada y estrategia de renovación/obtención bajo demanda; contemplar comportamiento de caché. |
| Complejidad al combinar “sala actual”, “toda la sala” y niños de otras salas. | Modelar reglas de forma explícita (`room_id` actual, `post_children` vacío para toda la sala, visibilidad por vínculo hijo) y cubrirlas en criterios/validación manual. |
| Cambios de esquema/enum (`mood`, `daycare_id`, campos de fotos) impactan tipos y código existente. | Migraciones versionadas, actualización de tipos/consultas en app y verificación con `tsc`, `lint` y `build`. |
| Carga/memoria en cliente al previsualizar o subir varias imágenes (hasta 10 MB total). | Validar límites antes de enviar, limitar a 5 archivos/formatos permitidos y mostrar estados/errores claros. |

## Lo que **no** está en esta spec

- Reacciones, comentarios, contadores y métricas sociales reales de publicaciones.
- Notificaciones push/email, resúmenes diarios o preferencias de avisos derivadas de posts.
- Borradores, programación, edición masiva o historial/auditoría de cambios.
- Paginación infinita, búsqueda/filtros avanzados del feed o detalle dedicado de publicación.
- Procesamiento avanzado de imágenes (recorte, compresión server-side obligatoria, CDN dedicado).
- Cambios en flujos de invitaciones, autenticación o gestión de niños/padres fuera de lo necesario para publicar y visualizar el feed.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, irá en su propia spec.
