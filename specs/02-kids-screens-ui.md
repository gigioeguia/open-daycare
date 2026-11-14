# SPEC 02 — Pantallas de niños y perfil (UI)

> **Estado:** Implementado  
> **Depende de:** SPEC 01  
> **Fecha:** 2026-11-14  
> **Objetivo:** Implementar el diseño de las pantallas de listado de niños (`/kids`) y perfil de niño (`/kids/[id]`) en OpenDayCare, reutilizando un shell compartido y datos ficticios, solo como interfaces y componentes.

## 1. Por qué existe esta spec

La app ya cuenta con el feed home (SPEC 01) y necesita las vistas de gestión de niños como base visual y de componentes para flujos futuros, manteniendo fidelidad con las referencias `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html` sin introducir lógica de negocio ni persistencia.

## Alcance

**Incluye:**

- Crear las rutas App Router `app/kids/page.tsx` (listado) y `app/kids/[id]/page.tsx` (perfil de niño).
- Extraer y reutilizar un shell de aplicación compartido (sidebar de escritorio + top bar y drawer móvil con estado local de abrir/cerrar) para que Feed, Niños y Perfil compartan la misma estructura y cambien el ítem activo según la ruta/pantalla (refactor mínimo de UI sobre lo implementado en SPEC 01, sin cambiar el comportamiento visual del feed).
- Reimplementar con React + Tailwind/CSS el diseño visual de `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html` (paleta, tipografías existentes, espaciados, radios, bordes, sombras, gradientes, avatares, chips/badges, tarjetas, alertas y jerarquía), con apariencia clara fija.
- Layout 100% responsivo: en escritorio sidebar fija (`248px`, sticky/full-height visual) y contenido principal centrado según cada referencia; en pantallas pequeñas el sidebar se oculta y se muestra top bar con botón de menú que abre/cierra un drawer con la misma navegación, perfil y CTA.
- **Listado `/kids`** (`app/kids/page.tsx`): contexto "GESTIÓN / Niños", CTA "Agregar niño", buscador visual, separador "SALA SOLES · 8 niños" y grid de 8 tarjetas de niños con avatar, nombre, edad, texto de padres vinculados y badge/chevron según corresponda.
- **Perfil `/kids/[id]`** (`app/kids/[id]/page.tsx`): enlace "Volver a Niños", cabecera con avatar grande, nombre, edad/sala y botón "Editar", bloque de alergias/notas (cuando aplique), ficha de datos (fecha de nacimiento, sala, ingreso), CTA "Resumen del día" y bloque "Padres vinculados" con estados y acción "Vincular otro padre".
- Datos ficticios hardcodeados en español, tipados y centralizados para la feature kids, con perfil detallado para los 8 niños del listado (cada tarjeta navega a su `/kids/[id]` usando el `id` del niño).
- Navegación de UI del alcance funcionando: ítem "Niños" del shell → `/kids`, ítem "Feed" → `/`, cada tarjeta del listado → `/kids/[id]`, y "Volver a Niños" → `/kids`. Los demás CTAs/enlaces presentes en las referencias (Nueva publicación, Agregar niño, Editar, Resumen del día, Vincular otro padre, Cerrar sesión, Avisos, Mi cuenta, buscador) se renderizan con su estilo pero sin ruta/acción real (`href="#"` o equivalente no navegable de negocio).
- Descomposición en componentes finos con nombres en inglés; iconografía SVG nueva/compartida extraída como componentes reutilizables (sin SVGs inline duplicados en JSX), reutilizando iconos existentes cuando coincidan.

**Fuera de alcance (para futuras specs):**

- Autenticación, sesiones, permisos, cierre de sesión real y control de acceso.
- Base de datos, API, persistencia, fetch de datos, estado remoto o generación dinámica real de niños.
- Búsqueda/filtrado real, formularios funcionales, creación/edición de niños, vinculación real de padres, resumen del día real, subida de fotos o acciones de negocio.
- Rutas/páginas destino reales para Agregar niño, Editar, Resumen del día, Vincular padre, Avisos, Mi cuenta, Crear publicación, Login u otras no incluidas explícitamente.
- Lógica de dominio, validaciones, internacionalización, temas configurables o modo oscuro.
- Pruebas automatizadas (no hay configuración de tests en el proyecto).

## Modelo de datos

Esta feature no introduce persistencia ni estructuras de dominio compartidas; define tipos y constantes locales de UI para render estático en `app/components/kids/kids-data.ts`. El shell compartido podrá definir/ajustar tipos mínimos de navegación/usuario de UI en `app/components/shell/` (o equivalente acordado) para ser reutilizado por feed y kids.

```ts
// app/components/kids/kids-data.ts
export type KidListBadgeTone = "allergy" | "link";

export type KidListItem = {
  id: string;               // identificador de ruta, ej. "mateo"
  name: string;             // "Mateo Fernández"
  ageLabel: string;         // "3 años"
  linkedParentsLabel: string; // "2 padres vinculados"
  initial: string;          // "M"
  avatarBackground: string; // ej. "#A9D9E8"
  avatarColor: string;      // ej. "#1F7A93"
  badgeLabel?: string;      // "MANÍ" | "VINCULAR" | "LACTOSA"
  badgeTone?: KidListBadgeTone;
  showChevron?: boolean;
};

export type ParentStatus = "active" | "pending";

export type LinkedParent = {
  id: string;
  name: string;
  relationLabel: string;    // "Mamá · activa" | "Papá · invitación enviada"
  initial: string;
  avatarBackground: string;
  status: ParentStatus;     // "active" -> ACTIVA, "pending" -> PENDIENTE
  statusLabel: string;      // "ACTIVA" | "PENDIENTE"
};

export type KidProfile = {
  id: string;
  name: string;
  ageLabel: string;         // "3 años"
  roomLabel: string;        // "Sala Soles"
  initial: string;
  avatarBackground: string;
  avatarColor: string;
  birthDateLabel: string;   // "12 mar 2022"
  admissionLabel: string;   // "feb 2025"
  allergyTitle?: string;    // "Alergias y notas"
  allergyNote?: string;     // texto completo de la alerta
  parents: LinkedParent[];
};

export type KidsPageData = {
  sectionLabel: string;     // "GESTIÓN"
  title: string;            // "Niños"
  searchPlaceholder: string;// "Buscar niño…"
  roomGroupLabel: string;   // "SALA SOLES"
  roomGroupCountLabel: string; // "8 niños"
  addChildLabel: string;    // "Agregar niño"
  kids: KidListItem[];
};

export type KidProfilePageData = {
  backLabel: string;        // "Volver a Niños"
  editLabel: string;        // "Editar"
  daySummaryLabel: string;  // "Resumen del día"
  parentsSectionLabel: string; // "PADRES VINCULADOS"
  linkAnotherParentLabel: string; // "Vincular otro padre"
  profile: KidProfile;
};
```

**Contenido ficticio fijo (fiel a referencias, contexto Sala Soles):**

- **Shell (para estas pantallas):** marca `OpenDayCare`, subtítulo de sala `Sala Soles`, CTA lateral `Nueva publicación`, ítems `Feed`, `Niños`, `Avisos`, `Mi cuenta` (activo: `Niños` en `/kids` y `/kids/[id]`), usuario `Caro Giménez` (`C`), rol `Maestra · Soles`.
- **Listado (`kidsPageData`):** 8 niños en orden de `references/pantallas/ninos.dc.html`, identificados por `id`:
  1. `id: "mateo"` — Mateo Fernández, 3 años, 2 padres vinculados, `M`, `#A9D9E8/#1F7A93`, badge `MANÍ` (`allergy`).
  2. `id: "sofia"` — Sofía Méndez, 2 años, 1 padre vinculado, `S`, `#F4B8CC/#C44A7A`, chevron.
  3. `id: "benjamin"` — Benjamín Ruiz, 3 años, 2 padres vinculados, `B`, `#B9DEC4/#3E8B62`, chevron.
  4. `id: "valentina"` — Valentina Soto, 2 años, sin padres vinculados, `V`, `#F4DC8E/#9A7B1E`, badge `VINCULAR` (`link`).
  5. `id: "tomas"` — Tomás Díaz, 3 años, 1 padre vinculado, `T`, `#C9B6E8/#7B5FC0`, badge `LACTOSA` (`allergy`).
  6. `id: "emma"` — Emma Castro, 2 años, 1 padre vinculado, `E`, `#F4B8CC/#C44A7A`, chevron.
  7. `id: "lucas"` — Lucas Romero, 3 años, 1 padre vinculado, `L`, `#A9D9E8/#1F7A93`, chevron.
  8. `id: "olivia"` — Olivia Vega, 2 años, 1 padre vinculado, `O`, `#B9DEC4/#3E8B62`, chevron.
- **Perfiles (`/kids/[id]`):** datos completos para los 8 IDs anteriores, misma estructura visual. `id: "mateo"` debe coincidir fielmente con `references/pantallas/perfil-nino.dc.html` (12 mar 2022, Sala Soles, ingreso feb 2025, alerta "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.", padres Lucía Fernández ACTIVA y Diego Fernández PENDIENTE con avatares/etiquetas de la referencia). Los demás perfiles usan datos ficticios coherentes con su tarjeta (edad/sala, padres según cantidad/estado sugerido; alerta de alergias presente cuando la tarjeta lo indica, ej. Tomás/lactosa, y ausente en el resto salvo decisión visual coherente documentada en implementación).

## Plan de implementación

1. **Extraer shell compartido y adaptar feed.** Crear componentes de layout compartido en `app/components/shell/` (p. ej. `AppShell.tsx`, `Sidebar.tsx`, `MobileTopBar.tsx`, piezas de navegación/usuario necesarias) con props tipadas para contexto (sala/subtítulo, usuario, ítem activo, destino de marca/home) y estado de cliente solo para abrir/cerrar drawer. Refactorizar `app/page.tsx` y/o `app/components/feed/*` para consumir el shell compartido manteniendo el resultado visual y datos de SPEC 01 (`Sala Lunas`, `Laura Méndez`, feed). Verificación manual: `/` se ve y se comporta igual que antes (incluido responsive/drawer) y el código del shell queda reutilizable.
2. **Datos y tipos de kids.** Crear `app/components/kids/kids-data.ts` con los tipos y constantes/exportaciones necesarias (`kidsPageData`, perfiles por `id` o función de acceso por `id`) según el modelo de datos, incluyendo los 8 niños y sus perfiles. Verificación: módulo tipado sin errores y cada `id` del listado resuelve un perfil.
3. **Iconografía y piezas atómicas de kids.** Crear/reutilizar componentes de icono SVG necesarios (lupa, chevron derecha, flecha atrás, alerta/warning, sol/resumen del día, plus en círculo, etc.) como componentes en ubicación compartida o de feature según la estructura elegida, reutilizando iconos existentes cuando coincidan. Crear piezas atómicas de UI en `app/components/kids/` (p. ej. avatar/inicial, badge/chip, tarjeta de niño, bloque de alerta, fila de dato, tarjeta de padre, encabezados/secciones) replicando estilos de las referencias. Verificación: piezas renderizan correctamente al integrarse, sin SVGs inline duplicados.
4. **Pantalla listado `/kids`.** Crear componentes de composición en `app/components/kids/` (p. ej. `KidsPageHeader.tsx`, `KidsSearchInput.tsx`, `KidsRoomSection.tsx`, `KidCard.tsx`, `KidsGrid.tsx` o equivalentes finos) y `app/kids/page.tsx` que renderice el shell compartido con ítem `Niños` activo y el contenido del listado enlazando cada tarjeta a `/kids/[id]`; "Agregar niño" y buscador quedan visuales sin acción real. Verificación: `/kids` reproduce la estructura/jerarquía de `references/pantallas/ninos.dc.html` y es responsive.
5. **Pantalla perfil `/kids/[id]`.** Crear componentes de composición en `app/components/kids/` (p. ej. `KidProfileHeader.tsx`, `KidAllergyNotice.tsx`, `KidInfoCard.tsx`, `KidParentsCard.tsx`, `LinkedParentItem.tsx` o equivalentes finos) y `app/kids/[id]/page.tsx` que resuelva el `id`, renderice el shell compartido con ítem `Niños` activo y el perfil correspondiente, con "Volver a Niños" → `/kids`; CTAs "Editar", "Resumen del día", "Vincular otro padre" y cerrar sesión sin acción real. Manejar `id` inexistente con un estado visual simple dentro de la misma pantalla (p. ej. mensaje y enlace a `/kids`) sin crear rutas/flujo adicional. Verificación: `/kids/mateo` es fiel a `references/pantallas/perfil-nino.dc.html` y los demás IDs renderizan perfiles completos coherentes.
6. **Ajuste fino de fidelidad visual y validación.** Pulir detalles (gradientes, sombras, bordes, gaps, alineaciones, tipografía, estados hover/activos visibles en referencia, tamaños de SVG) para igualar las referencias en escritorio y mantener coherencia en móvil. Verificación: `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores y la comparación visual contra `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html` es satisfactoria.

## Criterios de aceptación

- [x] Existen las rutas `app/kids/page.tsx` y `app/kids/[id]/page.tsx` y renderizan las pantallas de listado y perfil respectivamente (solo UI/componentes, sin lógica de negocio ni datos remotos).
- [x] El listado `/kids` reproduce la estructura de `references/pantallas/ninos.dc.html`: contexto Sala Soles/Caro Giménez en el shell, encabezado "GESTIÓN / Niños", CTA "Agregar niño", buscador visual, grupo "SALA SOLES · 8 niños" y las 8 tarjetas con avatar, datos y badge/chevron correspondientes.
- [x] El perfil `/kids/mateo` reproduce la estructura y contenido de `references/pantallas/perfil-nino.dc.html`: volver a Niños, cabecera con avatar/edad/sala/Editar, alerta de alergias, ficha (fecha de nacimiento, sala, ingreso), CTA "Resumen del día" y padres vinculados (Lucía ACTIVA, Diego PENDIENTE) con acción "Vincular otro padre".
- [x] Todos los IDs del listado tienen perfil renderizable en `/kids/[id]` con la misma estructura visual y datos ficticios coherentes; un `id` inexistente muestra un estado visual simple con enlace de regreso a `/kids`.
- [x] La navegación del alcance funciona: `Feed` → `/`, `Niños` → `/kids`, cada tarjeta → `/kids/[id]`, "Volver a Niños" → `/kids`; el ítem activo del shell es correcto en `/`, `/kids` y `/kids/[id]`. Los demás enlaces/CTAs se muestran con estilo pero sin acción/ruta real.
- [x] Existe un shell compartido reutilizado por feed y pantallas de kids, con comportamiento responsive equivalente a SPEC 01: sidebar fija en escritorio y top bar + drawer (abrir/cerrar por estado local) en móvil, sin overflow horizontal roto.
- [x] La implementación mantiene apariencia clara fija, usa la base visual/tipografías del proyecto, y los componentes están descompuestos en archivos finos con nombres en inglés (incluye datos en `app/components/kids/kids-data.ts` e iconos como componentes reutilizables, sin SVGs inline duplicados).
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores y `/` (feed) conserva su comportamiento visual tras la extracción del shell.

## Decisiones

- **Sí:** rutas `app/kids/page.tsx` y `app/kids/[id]/page.tsx` (segmento `kids`) para reflejar el alcance de UI y permitir navegación interna real entre listado y perfil.
- **Sí:** identificadores de niño como `id` (p. ej. `mateo`, `sofia`, …) en datos y parámetro de ruta, en lugar de slugs compuestos.
- **Sí:** contenido/contexto visual "Sala Soles / Caro Giménez" hardcodeado según referencias, aunque difiera del feed actual "Sala Lunas / Laura Méndez".
- **Sí:** extraer un shell compartido en `app/components/shell/` (o equivalente de layout UI) y refactorizar el feed para reutilizarlo, manteniendo su apariencia y datos.
- **Sí:** diseño 100% responsivo con top bar + drawer móvil controlado por estado de cliente local, consistente con SPEC 01.
- **Sí:** navegación funcional solo dentro del alcance (`/`, `/kids`, `/kids/[id]` y enlaces entre estas vistas); el resto de CTAs/enlaces queda estático sin acción de negocio.
- **Sí:** listado completo (8 niños) y perfil detallado para los 8 IDs, con `id: "mateo"` fiel a la referencia de perfil.
- **Sí:** componentes/datos/iconos organizados con nombres en inglés (`app/components/kids/*`, `app/components/kids/kids-data.ts`, iconos reutilizables) y UI en español.
- **Sí:** reimplementación en React + Tailwind/CSS (no HTML inline literal) con SVGs extraídos a componentes reutilizables.
- **Sí:** navegación interna (`/`, `/kids`, `/kids/[id]`) implementada con `next/link` de Next.js App Router en lugar de etiquetas `<a>` tradicionales; solo los CTAs/enlaces sin acción de negocio usan `href="#"`. Considerar esta convención en nuevas specs.
- **No:** base de datos, API, búsqueda real, formularios o acciones de negocio; fuera de alcance por ser "solo interfaces y componentes".
- **No:** duplicar un sidebar/shell por feature o limitar la entrega a desktop sin responsividad, para evitar inconsistencia y deuda de mantenimiento.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La extracción del shell compartido puede alterar sutilmente el feed de SPEC 01. | Limitar el refactor a UI compartida, conservar `feedPageData`/contenido existente y verificar visualmente `/` (desktop y móvil) como parte de la implementación. |
| Diferencias de contexto (Sala Soles/Caro vs Sala Lunas/Laura) pueden generar inconsistencia percibida entre pantallas. | Aceptado por decisión: cada pantalla usa el contexto definido por su spec/referencia; el shell recibirá props para soportar ambos contextos. |
| Los perfiles distintos a Mateo no tienen mockup individual detallado. | Definir datos ficticios coherentes con las tarjetas y aplicar la misma estructura/componentes del perfil de referencia, dejando la variación documentada en `kids-data.ts`. |
| SVGs/estilos inline de las referencias pueden no traducirse 1:1 a Tailwind. | Extraer iconos a componentes, usar valores de color/medida de las referencias y comparar visualmente con `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html`. |
| `id` de perfil inexistente puede romper la ruta dinámica. | Resolver el perfil por `id` y renderizar un estado visual simple con enlace a `/kids` dentro de `app/kids/[id]/page.tsx`. |

## Lo que **no** está en esta spec

- Autenticación, login real, sesiones, permisos o cierre de sesión real.
- Base de datos, APIs, persistencia o carga dinámica de datos.
- Búsqueda real, formularios, alta/edición de niños, vinculación real de padres o resumen del día funcional.
- Rutas/acciones reales para Agregar, Editar, Vincular, Resumen del día, Avisos, Mi cuenta, Nueva publicación o Login.
- Subida/visor de fotos, lógica de negocio o nuevas pantallas fuera de listado y perfil de niños.
- Modo oscuro, theming configurable, internacionalización o pruebas automatizadas.

Cada uno de esos puntos, si se aborda, irá en su propia spec.
