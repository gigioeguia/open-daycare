# SPEC 01 — Home feed (plantilla Sala Lunas)

> **Estado:** Implementado  
> **Depende de:** —  
> **Fecha:** 2026-11-14  
> **Objetivo:** Implementar la plantilla `references/pantallas/feed.dc.html` como home (`/`) de OpenDayCare con datos ficticios, estilo visual fiel y layout 100% responsivo, sin autenticación ni base de datos.

## 1. Por qué existe esta spec

La app parte del template por defecto de Next.js y necesita una primera pantalla de producto (feed de sala) que sirva como base visual y de componentes para futuras pantallas, respetando el diseño provisto como referencia.

## Alcance

**Incluye:**

- Reemplazar el contenido de `app/page.tsx` para renderizar el home como feed basado en `references/pantallas/feed.dc.html`.
- Ajustar `app/layout.tsx` para cargar las tipografías `Fredoka` y `Nunito` (Google Fonts vía `next/font/google`), definir `lang="es"` y actualizar `metadata` acorde a la pantalla (título/descripción de OpenDayCare/Sala Lunas).
- Ajustar `app/globals.css` para aplicar la base visual de la plantilla: fondo `#F6ECDF`, color de texto `#3F362E`, tipografía base `Nunito`, `box-sizing`, estilos base de enlaces y scrollbar según la plantilla, forzando apariencia clara fija (sin modo oscuro).
- Reimplementar el diseño con React + Tailwind/CSS de forma fiel al resultado visual de la plantilla (paleta, tipografías, espaciados, radios, bordes, sombras, gradientes, chips, avatares y SVGs equivalentes).
- UI estática sin navegación real: todos los enlaces/botones de la plantilla se renderizan con su estilo pero sin rutas funcionales (p. ej. `href="#"` o elemento no navegable equivalente), sin acciones de negocio.
- Contenido hardcodeado con datos ficticios en español (ver **Modelo de datos**), manteniendo la estructura de la plantilla: encabezado de sala, composer, separador "PUBLICADO HOY" y 3 publicaciones (logro, actividad con foto placeholder, anuncio).
- Descomposición en componentes finos bajo `app/components/feed/` (ver **Plan de implementación**) y datos ficticios centralizados en `app/components/feed/feed-data.ts`.
- Layout 100% responsivo: en escritorio se mantiene la disposición de la plantilla (sidebar fija de `248px` + área principal con contenido centrado `max-width: 760px`); en pantallas pequeñas el sidebar se oculta y se muestra una top bar con logo/título y botón de menú que abre/cierra un drawer con la misma navegación, perfil y CTA.
- Interactividad de UI local permitida únicamente para abrir/cerrar el drawer responsive (componente de cliente), sin autenticación, sin datos remotos y sin cambio de ruta.

**Fuera de alcance (para futuras specs):**

- Autenticación, sesiones, cierre de sesión real y control de acceso.
- Base de datos, API, persistencia, fetch de datos o estado remoto.
- Navegación real y creación de rutas/páginas destino (`/ninos`, `/avisos`, `/mi-cuenta`, crear publicación, detalle, foto, login, etc.) o páginas placeholder.
- Formularios funcionales, creación/edición/publicación real, likes/comentarios reales, subida de fotos o visor de imagen.
- Nuevas pantallas distintas al feed home.
- Internacionalización, temas configurables por usuario o modo oscuro.
- Pruebas automatizadas (no hay configuración de tests en el proyecto).

## Modelo de datos

Esta feature no introduce persistencia ni estructuras de dominio compartidas; define tipos y constantes locales de UI para render estático en `app/components/feed/feed-data.ts`.

```ts
// app/components/feed/feed-data.ts
export type NavItemId = "feed" | "children" | "notices" | "account";
export type PostCategory = "achievement" | "activity" | "announcement";

export type FeedUser = {
  name: string;        // "Laura Méndez"
  role: string;        // "Maestra · Lunas"
  initial: string;     // "L"
};

export type NavItem = {
  id: NavItemId;
  label: string;       // "Feed" | "Niños" | "Avisos" | "Mi cuenta"
  active: boolean;
};

export type Post = {
  id: string;
  category: PostCategory;
  authorName: string;      // niño o "Anuncio general"
  authorInitial?: string;  // "S" | "D" (ausente en anuncio)
  time: string;            // "10:15"
  publishedBy: string;     // "publicado por vos"
  audience: string;        // "Para: familia de Sofía" | "Para: toda la sala"
  content: string;
  photoPlaceholderLabel?: string; // "Foto · pintura con dedos"
  reactions: number;
  comments: number;
};

export type FeedPageData = {
  orgLabel: string;      // "GUARDERÍA · SALA LUNAS"
  greeting: string;      // "Buenas, Laura"
  meta: string;          // "10 niños · miércoles 14 oct"
  dayLabel: string;      // "PUBLICADO HOY"
  composerPrompt: string;// "Compartí un momento…"
  user: FeedUser;
  navItems: NavItem[];
  posts: Post[];
};
```

**Contenido ficticio fijo (`feedPageData`):**

- `orgLabel`: `GUARDERÍA · SALA LUNAS`; `greeting`: `Buenas, Laura`; `meta`: `10 niños · miércoles 14 oct`; `dayLabel`: `PUBLICADO HOY`; `composerPrompt`: `Compartí un momento…`.
- `user`: `{ name: "Laura Méndez", role: "Maestra · Lunas", initial: "L" }`.
- `navItems`: `Feed` (activo, `id: "feed"`), `Niños` (`id: "children"`), `Avisos` (`id: "notices"`), `Mi cuenta` (`id: "account"`) (inactivos).
- `posts` (en orden):
  1. `id: "post-achievement-sofia"`, `category: "achievement"`, `authorName: "Sofía"`, `authorInitial: "S"`, `time: "10:15"`, `audience: "Para: familia de Sofía"`, `content: "Armó un rompecabezas de 12 piezas sin ayuda. Se mostró muy concentrada y orgullosa del resultado."`, `reactions: 3`, `comments: 1`.
  2. `id: "post-activity-diego"`, `category: "activity"`, `authorName: "Diego"`, `authorInitial: "D"`, `time: "09:05"`, `audience: "Para: familia de Diego"`, `content: "Exploramos texturas con pintura de dedos. Diego probó mezclar amarillo y rojo para crear su propio color."`, `photoPlaceholderLabel: "Foto · pintura con dedos"`, `reactions: 4`, `comments: 2`.
  3. `id: "post-announcement-general"`, `category: "announcement"`, `authorName: "Anuncio general"`, `time: "07:45"`, `audience: "Para: toda la sala"`, `content: "Mañana realizaremos una lectura grupal en el patio. Traer una manta pequeña y su cuento favorito."`, `reactions: 6`, `comments: 0`.
- Todos los posts: `publishedBy: "publicado por vos"` y acción visible `Editar` (estática, sin navegación).

## Plan de implementación

1. **Base de tema y tipografías.** Actualizar `app/layout.tsx` para importar `Fredoka` y `Nunito` desde `next/font/google` (con variables CSS/utilidades necesarias), establecer `lang="es"` y `metadata` (`title`: "OpenDayCare · Sala Lunas", `description` coherente). Actualizar `app/globals.css` para eliminar el tema oscuro por `prefers-color-scheme`, definir estilos base y tokens/variables de color de la plantilla (`#F6ECDF`, `#3F362E`, etc.), tipografía base `Nunito` y scrollbar según referencia. Verificación: la app carga sin errores y aplica fondo/fuentes globales.
2. **Datos y tipos de UI.** Crear `app/components/feed/feed-data.ts` con los tipos y la constante `feedPageData` definidos en el modelo de datos. Verificación: módulo tipado sin errores y exporta los 3 posts y datos de sala/usuario.
3. **Iconografía e piezas atómicas.** Crear componentes finos de íconos SVG en `app/components/feed/icons/` (al menos: logo/sol, plus, home, niños, avisos/campana, cuenta/usuario, logout, cámara, corazón, comentario, imagen, megáfono y menú/cerrar para responsive) y piezas atómicas reutilizables en `app/components/feed/` (p. ej. `Avatar.tsx`, `CategoryBadge.tsx`, `PostActions.tsx`, `PhotoPlaceholder.tsx`, `SidebarNavItem.tsx`, `UserBadge.tsx`) replicando los estilos de la plantilla. Verificación: componentes renderizan de forma aislada al integrarse, sin estilos rotos.
4. **Componentes de estructura del feed.** Crear `app/components/feed/FeedHeader.tsx`, `ComposerPrompt.tsx`, `DaySection.tsx`, `PostHeader.tsx`, `PostCard.tsx`, `Sidebar.tsx` y `MobileTopBar.tsx` (o equivalente) que compongan las piezas atómicas y consuman `feedPageData`/props tipadas, manteniendo textos, jerarquía y estilos de la plantilla. Verificación: el árbol de componentes representa sidebar, encabezado, composer, separador y 3 tarjetas con sus variantes.
5. **Shell responsive y composición de página.** Crear `app/components/feed/FeedShell.tsx` como componente de cliente que gestione solo el estado `isDrawerOpen` (abrir/cerrar) y componga: top bar móvil + drawer (con overlay/cierre) en pantallas pequeñas y sidebar fija en escritorio, junto al contenido principal. Reescribir `app/page.tsx` para renderizar `FeedShell`/feed con `feedPageData`. Todos los enlaces internos se mantienen estáticos (`href="#"` o equivalente sin navegación real). Verificación: en escritorio se ve como la plantilla; en móvil aparece top bar y el drawer abre/cierra mostrando la misma navegación/perfil/CTA.
6. **Ajuste fino de fidelidad visual y validación.** Pulir detalles (gradientes, sombras, bordes, gaps, estados visuales activos, alineaciones, tamaños de SVG) para igualar la plantilla en escritorio y conservar coherencia en móvil. Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build` para confirmar que el proyecto compila correctamente. Verificación: checks en verde y comparación visual satisfactoria contra `references/pantallas/feed.dc.html`.

## Criterios de aceptación

- [x] La ruta `/` (`app/page.tsx`) muestra el feed de sala y ya no renderiza el contenido por defecto de "Create Next App".
- [x] La pantalla usa las tipografías `Fredoka` y `Nunito`, fondo `#F6ECDF` y paleta base de la plantilla, con apariencia clara fija (no cambia a tema oscuro por preferencias del sistema).
- [x] En escritorio el layout reproduce la estructura de la plantilla: sidebar izquierda fija (`248px`, sticky/full-height visual) y área principal con contenido centrado (`max-width: 760px`) y los bloques de encabezado, composer, separador "PUBLICADO HOY" y lista de publicaciones.
- [x] Se muestran exactamente 3 publicaciones con los datos ficticios definidos: Sofía (LOGRO, 10:15, 3 reacciones, 1 comentario), Diego (ACTIVIDAD con placeholder "Foto · pintura con dedos", 09:05, 4 reacciones, 2 comentarios) y Anuncio general (ANUNCIO, 07:45, 6 reacciones, 0 comentarios), con textos, audiencias y etiqueta "publicado por vos".
- [x] Todos los elementos de navegación/acciones de la plantilla (CTA "Nueva publicación", ítems Feed/Niños/Avisos/Mi cuenta, "Editar", enlaces del composer/foto/detalle/logout) están presentes visualmente pero no navegan a rutas reales ni ejecutan lógica de negocio.
- [x] En viewports pequeños no hay overflow horizontal roto: el sidebar se reemplaza por una top bar y un drawer que se puede abrir y cerrar mediante interacción de UI local, mostrando la misma navegación, perfil y CTA.
- [x] Los componentes del feed están descompuestos en archivos finos bajo `app/components/feed/` (incluye íconos en `app/components/feed/icons/` y datos en `app/components/feed/feed-data.ts`).
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores.

## Decisiones tomadas y descartadas

- **Sí:** traducir la plantilla a React + Tailwind/CSS manteniendo fidelidad visual (1.a) para integrarla a la stack del proyecto sin incrustar HTML inline literal.
- **Sí:** aplicar tipografías y tema visual de la plantilla a nivel global/layout (2.a) para consistencia de la home.
- **Sí:** UI estática sin navegación real ni rutas placeholder (3.a) porque no hay otras pantallas, auth ni backend en este alcance.
- **Sí:** contenido hardcodeado ficticio y fijo (4.b, set aprobado: Sala Lunas / Laura Méndez / Sofía, Diego, anuncio) para validar estructura y estilo sin depender de datos reales.
- **Sí:** descomposición en componentes finos bajo `app/components/feed/` con íconos separados y datos en `feed-data.ts` (2.b, 3.a bloque 3) para mantenibilidad y reutilización futura.
- **Sí:** apariencia clara fija, eliminando/neutralizando dark mode actual (3.a) para que el resultado coincida con la paleta de la plantilla.
- **Sí:** layout 100% responsivo con sidebar fija en escritorio y top bar + drawer en móvil (1.a bloque 3), permitiendo estado de cliente solo para abrir/cerrar el drawer (2.a bloque 3) como mínima interactividad de UI local.
- **No:** portar el HTML/inline styles literalmente (1.b), para evitar deuda de mantenimiento y aprovechar componentes/tokens.
- **No:** aislar estilos solo al home (2.b), para que la base visual global coincida con la referencia elegida.
- **No:** crear rutas/páginas placeholder o navegación funcional (3.b/3.c), fuera del alcance sin backend/auth y no solicitado.
- **No:** mantener soporte de dark mode (3.b), porque altera el resultado respecto a la plantilla.
- **No:** responsive por apilado estático sin toggle (1.b bloque 3) ni bottom nav (1.c), para preservar acceso a la navegación completa y la identidad del layout con mínima complejidad.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Diferencias sutiles de render entre HTML inline original y Tailwind/Next (fuentes, pesos, antialiasing, sombras). | Usar las mismas familias/pesos (`Fredoka` 400–700, `Nunito` 400–800), valores de color/medida de la plantilla y comparar visualmente contra `references/pantallas/feed.dc.html`. |
| El layout de escritorio con sidebar fija puede romperse en móviles si no se adapta. | Definir breakpoint claro para cambiar a top bar + drawer, evitar anchos fijos en contenedores internos y verificar ausencia de overflow horizontal. |
| Introducir estado de cliente para el drawer puede afectar el render si se ubica mal en App Router. | Limitar `"use client"` al shell/componente que maneja `isDrawerOpen`; mantener componentes presentacionales como server components cuando sea posible. |
| Neutralizar dark mode afecta la apariencia por defecto del template Next.js. | Aceptado por decisión (3.a); documentado como cambio global de tema en esta spec. |

## Lo que **no** está en esta spec

- Autenticación, login real, sesiones o permisos.
- Base de datos, APIs, persistencia o carga dinámica de datos.
- Rutas funcionales a otras pantallas, páginas placeholder o flujos de navegación reales.
- Crear/editar publicaciones, likes/comentarios reales, subida de imágenes o detalle de foto/publicación.
- Pantallas adicionales (Niños, Avisos, Mi cuenta, etc.).
- Modo oscuro, theming configurable o internacionalización.
- Pruebas automatizadas/end-to-end.

Cada uno de esos puntos, si se aborda, irá en su propia spec.
