# SPEC 06 — Modal “Nueva publicación” (UI)

> **Estado:** Implementado  
> **Depende de:** —  
> **Fecha:** 2026-11-15  
> **Objetivo:** Agregar en la pantalla de Feed un modal de **“Nueva publicación”**, basado en `references/pantallas/crear-publicacion.dc.html`, activado desde el botón **“+ Nueva publicación”** del panel izquierdo, con formulario y validación en cliente (sin persistencia).

## Alcance

**Incluye:**

- **Disparador (Feed, panel izquierdo):** el botón `+ Nueva publicación` del sidebar abre el modal. Solo este disparador (el composer `“Compartí un momento…”` de `app/components/feed/ComposerPrompt.tsx` no abre el modal en esta spec).
- **UI del modal (fiel a `references/pantallas/crear-publicacion.dc.html`):**
  - Overlay centrado, contenedor `max-width ~580px`, fondo `#FBF4EC`, borde `#ECE0D0`, esquinas redondeadas y sombra según referencia; cabecera con **`Cancelar`** (izquierda), título **`Nueva publicación`** (centro) y **`Publicar`** (derecha, acento).
  - Sección **PARA** (etiqueta en mayúsculas): opciones fijas en este orden — `Mateo` (inicial `M`, avatar azul `#A9D9E8/#1F7A93`), `Sofía` (`S`, `#F4B8CC/#C44A7A`), `Benjamín` (`B`, `#B9DEC4/#3E8B62`) y `Toda la sala` (chip sin avatar) — con estilo de selección múltiple como en el mock (seleccionado: borde/fondo oscuro y texto claro; no seleccionado: borde claro/fondo blanco).
  - Sección **TIPO** (etiqueta en mayúsculas): selección única entre exactamente 7 opciones en este orden, con sus colores de referencia: `Comida` (`#9A7B1E`, texto blanco), `Siesta` (`#E7DCF6`, `#7B5FC0`), `Actividad` (`#2E89A6`, blanco), `Logro` (`#CFEBD8`, `#3E9B6C`), `Ánimo` (`#F9D2DE`, `#C56486`), `Foto` (`#FBD8CC`, `#D9684A`), `Anuncio` (`#CCD8F4`, `#4E72C8`).
  - Sección **DESCRIPCIÓN** (etiqueta en mayúsculas): `textarea` con placeholder `Contá cómo le fue hoy…`, sin texto precargado al abrir.
  - Sección **FOTOS** (etiqueta en mayúsculas): se muestra la fila visual de la referencia (placeholder de imagen + tarjeta “Agregar” con ícono `+`); **“Agregar” no tiene funcionalidad** en esta spec (sin selector de archivos, sin carga). La sección es opcional a efectos de validación/publicación.
- **Comportamiento y validación en cliente (al publicar, sin persistencia ni llamadas remotas):**
  - **Para (obligatorio, mínimo 1):** al menos una opción seleccionada. **`Toda la sala` es global/excluyente:** seleccionarla desmarca a `Mateo/Sofía/Benjamín`; seleccionar cualquier niño individual desmarca `Toda la sala`. Se permite seleccionar uno o varios niños individuales a la vez.
  - **Tipo (obligatorio, selección única):** exactamente una opción seleccionada de las 7. Sin preselección inicial.
  - **Descripción (obligatoria, “solo letras” según 4.b):** no vacía tras recortar espacios extremos; solo se permiten **letras Unicode** (`\p{L}`, incluye acentos/ñ), **espacios en blanco** (espacio, tabulación, saltos de línea `\n/\r`) y **puntuación básica** `.` `,` `;` `:` `¡` `!` `¿` `?` `'` `"` `(` `)` `-`. Se rechazan **dígitos/números** (`\p{N}`) y cualquier otro símbolo no listado. Mostrar error visible si está vacía o contiene caracteres no permitidos.
  - **Fotos:** opcional; no se valida.
  - Si hay errores, el modal permanece abierto y muestra error visible por campo/sección inválida (mensaje y/o resaltado consistente con el proyecto, p. ej. en `Para`/`Tipo` mensaje bajo la sección; en descripción borde/mensaje). Si es válido, **“Publicar”** simula éxito: cierra el modal y **resetea** el formulario sin persistir ni modificar el feed/listado.
- **Acciones de cierre y estado inicial:** `Cancelar`, botón **`X`** en la cabecera (añadido para consistencia con modales existentes, manteniendo la jerarquía visual del header de la referencia), clic en overlay y tecla `Esc` cierran el modal. Al cerrar por cualquier vía se limpian valores y errores; al reabrir el estado es inicial (ningún `Para`, ningún `Tipo`, descripción vacía, fotos sin cambios).
- **Responsividad:** en móvil márgenes laterales y scroll interno si excede la altura; en escritorio centrado según referencia. Fidelidad visual razonable al mock.
- **Organización de código (convenciones del proyecto):**
  - Componentes cliente en inglés en `app/components/feed/` (p. ej. `CreatePostModal.tsx`) y utilidades/tipos/validación en `app/components/feed/create-post-form.ts` (análogo a `app/components/kids/add-child-form.ts`).
  - Estado de apertura orquestado en un componente cliente del flujo de Feed (p. ej. convertir `app/components/feed/FeedShell.tsx` en cliente o extraer un wrapper cliente mínimo) para controlar `open/close`.
  - `app/components/shell/Sidebar.tsx` y `app/components/shell/AppShell.tsx`: admitir disparo por callback además de `href` (p. ej. prop opcional `onNewPostClick`) para que el botón `+ Nueva publicación` ejecute la apertura sin navegar; mantener compatibilidad con el uso actual.
  - `app/components/feed/ComposerPrompt.tsx` permanece sin cambios funcionales en esta spec (no abre el modal).

**Fuera de alcance (futuras specs):**

- Persistencia, creación real de publicación, llamadas a API/base de datos o mutación del feed (`feed-data.ts`, posts renderizados).
- Funcionalidad de “Agregar” fotos/archivos, previsualización real o adjuntos.
- Cualquier disparador distinto al botón `+ Nueva publicación` del sidebar (incluido el composer).
- Mapeo de los 7 tipos UI a `PostCategory`/modelo de posts existente o cambios en `app/components/feed/feed-data.ts`.
- Edición/eliminación de publicaciones, borradores, preselecciones dinámicas o permisos.
- Pruebas automatizadas.

## Modelo de datos (UI, sin persistencia)

```ts
// app/components/feed/create-post-form.ts

export type PostAudienceId = "mateo" | "sofia" | "benjamin" | "everyone";
export type PostTypeId =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export type AudienceOption = {
  id: PostAudienceId;
  label: string; // "Mateo" | "Sofía" | "Benjamín" | "Toda la sala"
  initial?: string; // ausente para "everyone"
  avatarBackgroundColor?: string;
  avatarColor?: string;
  isGlobal?: boolean; // true para "everyone"
};

export type PostTypeOption = {
  id: PostTypeId;
  label: string; // "Comida" | "Siesta" | "Actividad" | "Logro" | "Ánimo" | "Foto" | "Anuncio"
  backgroundColor: string;
  color: string;
};

export type CreatePostFormValues = {
  audienceIds: PostAudienceId[]; // >= 1; "everyone" excluyente
  typeId: PostTypeId | "";
  description: string;
};

export type CreatePostFormErrors = {
  audience?: string;
  type?: string;
  description?: string;
};

export const initialCreatePostFormValues: CreatePostFormValues = {
  audienceIds: [],
  typeId: "",
  description: "",
};
```

**Contenido fijo / reglas:**

- Opciones `Para` (orden): `mateo` (Mateo, M, `#A9D9E8`/`#1F7A93`), `sofia` (Sofía, S, `#F4B8CC`/`#C44A7A`), `benjamin` (Benjamín, B, `#B9DEC4`/`#3E8B62`), `everyone` (Toda la sala, global/excluyente).
- Opciones `Tipo` (orden): `meal` Comida (`#9A7B1E`,`#FFFFFF`), `nap` Siesta (`#E7DCF6`,`#7B5FC0`), `activity` Actividad (`#2E89A6`,`#FFFFFF`), `achievement` Logro (`#CFEBD8`,`#3E9B6C`), `mood` Ánimo (`#F9D2DE`,`#C56486`), `photo` Foto (`#FBD8CC`,`#D9684A`), `announcement` Anuncio (`#CCD8F4`,`#4E72C8`).
- Validación descripción (sugerida, concreta): rechazar si `trim().length === 0` o si el valor contiene dígitos (`/\p{N}/u`) o caracteres fuera de letras/espacios/puntuación permitida (`/[^\p{L}\s.,;:¡!¿?'"()\-]/u`).
- Mensajes de error orientativos (español, en módulo de datos), p. ej.: `Seleccioná al menos un destinatario.`, `Seleccioná un tipo.`, `La descripción es obligatoria.`, `Usá solo letras y signos de puntuación (sin números).`

## Plan de implementación

1. **Datos y utilidades (`app/components/feed/create-post-form.ts`).** Definir tipos, opciones fijas de `Para`/`Tipo`, labels/placeholders, valores/errores iniciales, helper de selección de audiencia con regla global/excluyente (`everyone`) y validadores puros (`validateCreatePostForm`, chequeo de descripción sin dígitos/símbolos no permitidos). Verificación manual: casos vacío, con número/símbolo inválido, válido con acentos/saltos/puntuación, y regla excluyente.
2. **Componente modal (`app/components/feed/CreatePostModal.tsx`).** Implementar UI fiel a la referencia (header con `Cancelar`/título/`Publicar` + `X` accesible, secciones `PARA`, `TIPO`, `DESCRIPCIÓN`, `FOTOS` con “Agregar” sin acción). Estado controlado, errores por sección/campo, cierre por `Cancelar`/`X`/overlay/`Esc`, reset completo al cerrar. Verificación: render, selección múltiple/excluyente, selección única de tipo, textarea sin valor inicial.
3. **Cableado del disparador en shell/feed.** Extender `app/components/shell/Sidebar.tsx` y `app/components/shell/AppShell.tsx` para soportar `onNewPostClick` (botón en lugar de/en adición a `newPostHref`, manteniendo compatibilidad). Integrar estado `open/close` del modal en `app/components/feed/FeedShell.tsx` (componente cliente, según convenga con `AppShell`) y abrirlo solo desde el botón `+ Nueva publicación`; dejar `app/components/feed/ComposerPrompt.tsx` sin abrir modal. Verificación: en `/` el botón del sidebar abre el modal; el composer no.
4. **Validación, publicación simulada y responsive.** Conectar “Publicar” a `validateCreatePostForm`: con errores no cierra y marca secciones/campo; con datos válidos cierra y resetea sin tocar `feedPageData` ni el listado. Ajustar márgenes/scroll móvil y estados de foco/selección/error. Verificación manual en escritorio y móvil.
5. **Fidelidad y verificación técnica.** Ajustar detalles visuales frente a `references/pantallas/crear-publicacion.dc.html` y convenciones (clases canónicas, código en inglés). Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build` sin errores nuevos.

## Criterios de aceptación

- [x] En `/` (Feed), el botón **`+ Nueva publicación`** del panel izquierdo abre el modal con la estructura y contenido de `references/pantallas/crear-publicacion.dc.html` (título `Nueva publicación`, secciones `PARA`, `TIPO`, `DESCRIPCIÓN`, `FOTOS`). Verificado vía Playwright snapshot del navegador.
- [x] El composer `“Compartí un momento…”` no abre el modal. `ComposerPrompt.tsx` sin cambios funcionales.
- [x] **Para** es obligatorio y permite seleccionar ≥1 opción entre `Mateo`, `Sofía`, `Benjamín` y `Toda la sala`; `Toda la sala` es global/excluyente (al seleccionarla se desmarcan individuos y viceversa). Implementado en `toggleAudienceSelection` (`create-post-form.ts`).
- [x] **Tipo** es obligatorio, selección única, con exactamente las 7 opciones de la referencia (`Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio`) sin preselección inicial y sin alterar el modelo de posts (`typeId` inicial `""`, sin cambios en `feed-data.ts`).
- [x] **Descripción** es obligatoria y solo acepta letras Unicode (acentos/ñ), espacios/saltos de línea y puntuación básica (`.,;:¡!¿?'"()-`), rechazando dígitos y otros símbolos; valores inválidos/vacíos muestran error visible. Implementado en `validateCreatePostForm`.
- [x] **Fotos** es opcional y el control “Agregar” es visible pero no realiza ninguna acción. Verificado en UI (`aria-disabled`, sin `onClick`).
- [x] Con datos inválidos, **Publicar** no cierra el modal y muestra errores; con datos válidos, **Publicar** cierra y resetea sin persistir ni modificar el feed. Verificado inválido vía Playwright (modal permanece abierto tras intentar publicar vacío).
- [x] `Cancelar`, `X`, clic en overlay y `Esc` cierran el modal; al cerrar/reabrir el formulario vuelve a estado inicial limpio. Implementado en `CreatePostModal.tsx`.
- [x] Modal usable en móvil (márgenes y scroll interno) con fidelidad visual razonable al mock. Implementado (`max-h` + `overflow-y-auto`, márgenes laterales).
- [x] No hay cambios en datos/comportamiento existentes del feed (`app/components/feed/feed-data.ts`) ni llamadas remotas; `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores nuevos. Verificado en ejecución.

## Decisiones

- **Sí:** disparador único `+ Nueva publicación` del sidebar (1.a).
- **Sí:** opciones de `Para` fijas según referencia y desacopladas de datos reales (2.a).
- **Sí:** `Toda la sala` como selección global/excluyente (3).
- **Sí:** descripción “solo letras” interpretada como letras Unicode + espacios/saltos de línea + puntuación básica, sin dígitos (4.b), para mantener usabilidad.
- **Sí:** 7 tipos como valores UI propios del formulario, sin mapear ni modificar `PostCategory`/posts (5).
- **Sí:** publicar válido simula éxito (cerrar + reset) sin persistencia ni mutación del feed (6.a).
- **Sí:** patrón de cierre/reset consistente con modales existentes (`Cancelar`, `X`, overlay, `Esc`, reset completo) (7).
- **No:** funcionalidad de “Agregar” fotos, persistencia/APIs, mutación del feed, disparo desde composer, mapeo a modelo de posts, pruebas automatizadas.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La regla de descripción (4.b) puede rechazar caracteres útiles no previstos (p. ej. `/`, `@`, emojis) o ser confusa para el usuario. | Mensaje de error explícito (“solo letras y signos de puntuación, sin números”) y regex concreta documentada en `create-post-form.ts`; ajustar el conjunto permitido en una spec futura si se requiere. |
| Convertir `FeedShell`/flujo a cliente para estado del modal aumenta superficie cliente. | Limitar el estado a apertura/cierre del modal; mantener datos del feed (`feedPageData`) y composición sin lógica adicional. |
| Cambiar `Sidebar`/`AppShell` para soportar callback puede afectar otros usos. | Hacer `onNewPostClick` opcional y preservar el comportamiento por `href` cuando no se provea. |
| `Toda la sala` combinada con individuos puede generar ambigüedad si no se aplica bien la regla excluyente. | Centralizar la lógica de selección en un helper puro y cubrirla en verificación manual (toggle individuos ↔ global). |

## Lo que **no** está en esta spec

- Persistencia, backend/APIs, creación real ni mutación del feed.
- Subida/adjunto de fotos y funcionalidad de “Agregar”.
- Apertura del modal desde el composer u otros puntos.
- Mapeo de tipos UI a categorías/modelo de publicaciones existente.
- Pruebas automatizadas.

Cada uno de esos puntos, si se aborda, irá en su propia spec.
