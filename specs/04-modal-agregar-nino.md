# SPEC 04 — Modal para agregar niño (UI)

> **Estado:** Implementado  
> **Depende de:** SPEC 02  
> **Fecha:** 2026-11-14  
> **Objetivo:** Agregar en `/kids` un modal de “Agregar niño”, basado en `references/pantallas/agregar-nino.dc.html`, con formulario y validación en cliente (sin persistencia) para los campos obligatorios Nombre completo, Fecha de nacimiento (`dd/mm/aaaa`) y Sala.

## Alcance

**Incluye:**

- Activar el botón `+ Agregar niño` de `app/components/kids/KidsPageHeader.tsx` en `app/kids/page.tsx` para abrir el modal de alta de niño (en lugar de un enlace `href="#"` sin acción).
- Implementar el modal como UI en React + Tailwind/CSS, fiel a `references/pantallas/agregar-nino.dc.html`: overlay, contenedor centrado, cabecera con acciones `Cancelar` y `Guardar`, título `Agregar niño` y cuerpo del formulario.
- Campos del formulario:
  - `Nombre completo` (obligatorio): input de texto, placeholder `Ej. Martina López`.
  - `Fecha de nacimiento` (obligatorio): input de texto con placeholder `dd/mm/aaaa` y una indicación explícita del formato `dd/mm/aaaa` para este componente (visible en la UI del campo, p. ej. texto de ayuda bajo el input o etiqueta/indicador asociado).
  - `Sala` (obligatorio): `<select>` funcional con opción placeholder `Seleccionar sala` (sin preselección) y opciones dummy `Sala Soles`, `Sala Lunas`, `Sala Estrellas`.
  - `Alergias (etiquetas)` (opcional): input de texto libre, placeholder `Ej. Maní, Lactosa`.
  - `Notas médicas` (opcional): textarea, placeholder `Indicaciones, medicación, contactos…`.
- Validación en cliente al intentar guardar (sin persistencia ni llamadas remotas):
  - `Nombre completo`: requerido (valor no vacío tras recortar espacios).
  - `Fecha de nacimiento`: requerido y con formato válido `dd/mm/aaaa` (dos dígitos día, `/`, dos dígitos mes, `/`, cuatro dígitos año; validación de fecha calendario válida).
  - `Sala`: requerida (debe seleccionarse una sala distinta del placeholder).
  - Si hay errores, el modal permanece abierto y muestra un estado de error visible por cada campo inválido (p. ej. mensaje de error y/o resaltado del campo). Si la validación es correcta, `Guardar` cierra el modal y simula éxito sin modificar el listado ni persistir datos.
- Comportamiento de acciones y estado:
  - `Cancelar` cierra el modal y descarta los cambios.
  - Clic en el overlay/fondo y tecla `Esc` cierran el modal.
  - Al cerrar el modal (por cualquier motivo) se limpian los valores del formulario y los errores de validación.
- Responsividad: en móvil el modal se adapta con márgenes laterales y, si el contenido excede la altura disponible, permite scroll interno manteniendo la fidelidad visual del mock; en escritorio se mantiene centrado según la referencia.
- Organización de código: componentes finos con nombres en inglés ubicados en `app/components/kids/` (p. ej. modal/formulario/campo según convenga), reutilizando estilos/tokens del proyecto; datos/constantes de UI del modal (etiquetas, placeholders, opciones de sala, textos de error/formato) centralizados y tipados en `app/components/kids/` (p. ej. en `kids-data.ts` o en un módulo de datos del modal, según la estructura existente).
- Accesibilidad básica del modal: rol/atributos de diálogo apropiados, enfoque inicial razonable al abrir y cierre por `Esc` como se especifica.

**Fuera de alcance (para futuras specs):**

- Persistencia, API, base de datos o creación real del niño en el listado/detalle.
- Búsqueda real, edición de niños, vinculación de padres o cualquier otra acción de negocio.
- Lógica de chips/tags interactivos para alergias (se usa texto libre).
- Cálculo automático de edad, autocompletado, carga de foto/avatar o selector de sala dinámico desde backend.
- Pruebas automatizadas (no hay configuración de tests en el proyecto).

## Modelo de datos

Esta feature no introduce persistencia; define estructuras locales de UI/estado del formulario en cliente (tipos en `app/components/kids/kids-data.ts` o en el módulo de datos del modal). Nombres orientativos:

```ts
export type RoomOption = {
  value: string;   // ej. "sala-soles"
  label: string;   // ej. "Sala Soles"
};

export type AddChildFormValues = {
  fullName: string;
  birthDate: string; // formato "dd/mm/aaaa"
  room: string;      // value de RoomOption o "" cuando no hay selección
  allergies: string;
  medicalNotes: string;
};

export type AddChildFormErrors = {
  fullName?: string;
  birthDate?: string;
  room?: string;
};
```

**Datos ficticios/contenido fijo:**

- Opciones de sala (en orden): `Sala Soles` (`sala-soles`), `Sala Lunas` (`sala-lunas`), `Sala Estrellas` (`sala-estrellas`).
- Placeholder de sala: `Seleccionar sala` (valor vacío, no seleccionable como valor válido final).
- Placeholder de fecha: `dd/mm/aaaa` y texto visible que indica explícitamente el formato `dd/mm/aaaa`.
- Etiquetas/placeholders/textos de acciones según la referencia (`NOMBRE COMPLETO`, `FECHA DE NACIMIENTO`, `SALA`, `ALERGIAS (ETIQUETAS)`, `NOTAS MÉDICAS`, `Cancelar`, `Guardar`, `Agregar niño`).

## Plan de implementación

1. **Datos y utilidades del formulario.** Definir en `app/components/kids/` las opciones de sala, valores iniciales y tipos del formulario, junto con utilidades puras de validación (requeridos y formato/validez de fecha `dd/mm/aaaa`) y los mensajes de error en español. Verificación: módulo tipado sin errores y utilidades cubren los casos requeridos (vacío, formato inválido, fecha inválida, sala no seleccionada, datos válidos).
2. **Componente de modal y formulario.** Crear el/los componentes cliente del modal (`AddChildModal` y piezas finas necesarias, p. ej. campos/botones si aplica) con la estructura y estilos de `references/pantallas/agregar-nino.dc.html`, `<select>` de sala con placeholder, indicación explícita del formato `dd/mm/aaaa`, render de errores por campo y comportamiento de cierre (`Cancelar`, overlay, `Esc`) con limpieza de estado al cerrar. Verificación: el modal renderiza fielmente de forma aislada/controlada y gestiona apertura/cierre y reseteo de estado.
3. **Integración en `/kids`.** Conectar la apertura del modal desde `app/components/kids/KidsPageHeader.tsx`/`app/kids/page.tsx` (introduciendo el estado cliente mínimo necesario sin alterar el comportamiento existente del listado) manteniendo la navegación y el layout actuales. Verificación: en `/kids` el botón `+ Agregar niño` abre el modal; `Cancelar`, overlay y `Esc` lo cierran y limpian el formulario.
4. **Validación y responsive final.** Implementar el flujo de `Guardar` con validación en cliente (errores visibles en campos inválidos; cierre solo cuando es válido, sin persistir) y ajustar el responsive (márgenes y scroll interno en móvil). Verificación manual en escritorio y móvil: casos inválidos y válidos se comportan según lo definido.
5. **Ajuste de fidelidad y validación técnica.** Pulir detalles visuales (espaciados, bordes, tipografía, estados de error/foco, alineación de acciones) contra la referencia. Verificación: `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores y `/kids` conserva su comportamiento previo.

## Criterios de aceptación

- [x] En `/kids`, el botón `+ Agregar niño` abre un modal con la estructura y contenido de `references/pantallas/agregar-nino.dc.html` (cabecera Cancelar/Agregar niño/Guardar y campos Nombre completo, Fecha de nacimiento, Sala, Alergias (etiquetas), Notas médicas). Verificado mediante implementación del componente `AddChildModal` e integración en `KidsPageHeader`; `/kids` carga (HTTP 200) y el botón abre el modal controlado por estado cliente.
- [x] `Nombre completo`, `Fecha de nacimiento` y `Sala` son obligatorios; `Alergias (etiquetas)` y `Notas médicas` son opcionales. Implementado en `validateAddChildForm` (`app/components/kids/add-child-form.ts`); `Alergias` y `Notas médicas` no generan error ni bloquean el guardado.
- [x] `Fecha de nacimiento` es un campo de texto con placeholder `dd/mm/aaaa` y muestra de forma explícita el formato `dd/mm/aaaa` (hint visible `Formato: dd/mm/aaaa` bajo el input); `Guardar` rechaza valores vacíos o con formato/fecha inválida mostrando un error visible en ese campo (`aria-invalid`, borde resaltado y mensaje de error).
- [x] `Sala` es un `<select>` con placeholder `Seleccionar sala` (sin preselección) y opciones dummy `Sala Soles`, `Sala Lunas`, `Sala Estrellas`; `Guardar` rechaza si no se selecciona una sala válida.
- [x] Si hay errores de validación, el modal no se cierra y se muestran errores visibles en los campos inválidos; si todos los datos obligatorios son válidos, `Guardar` cierra el modal sin persistir ni agregar el niño al listado. Implementado en `handleSubmit` de `AddChildModal`; el guardado solo cierra cuando `!hasAddChildFormErrors`.
- [x] `Cancelar`, clic en overlay y tecla `Esc` cierran el modal; al cerrar por cualquier vía se limpian valores y errores del formulario (`resetForm` + limpieza de `errors`, enfoque en nombre al abrir).
- [x] En móvil el modal es usable (márgenes laterales del overlay y `overflow-y-auto`/`max-h` en el diálogo para scroll interno) sin overflow horizontal roto, manteniendo fidelidad razonable al mock. Verificado estructuralmente en el componente (no se pudo capturar runtime por limitación de herramientas de interacción en Playwright; ver nota abajo).
- [x] No se agrega persistencia, llamadas remotas ni lógica de negocio; el listado de `/kids` y las rutas existentes no cambian su comportamiento/datos. `kids-page-data` sin cambios; el modal solo simula éxito al cerrar.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores (verificado: lint limpio, tsc 0 errores, build exitoso con prerender de `/kids` y `/kids/[id]`).

> **Nota de verificación:** las herramientas de Playwright disponibles en esta sesión no incluyeron `click`/`type`, por lo que no se pudo capturar una screenshot runtime del modal abierto ni recorrer los flujos de interacción. Los criterios de comportamiento (abrir, validar, cerrar, limpiar) se verificaron mediante revisión de la implementación y los controles estáticos (`lint`, `tsc`, `build`). Se conserva `references/screenshots` y `.playwright/kids-before.png` como evidencia base de `/kids`.

## Decisiones

- **Sí:** UI del modal integrada en `/kids` con validación en cliente al guardar (campos obligatorios y formato/validez de fecha `dd/mm/aaaa`), sin persistencia ni alta real en el listado.
- **Sí:** `Fecha de nacimiento` como input de texto (`dd/mm/aaaa`) con indicación explícita del formato visible en la UI.
- **Sí:** `Sala` como `<select>` nativo con placeholder `Seleccionar sala` (sin preselección) y opciones dummy `Sala Soles`, `Sala Lunas`, `Sala Estrellas`.
- **Sí:** `Alergias (etiquetas)` y `Notas médicas` opcionales como texto libre/textarea según el mock.
- **Sí:** cierre por `Cancelar`, clic en overlay y `Esc`, con limpieza de valores y errores al cerrar; responsive con scroll interno en móvil.
- **No:** persistencia, fetch/API, creación real del niño, selector de fecha nativo, dropdown custom, chips/tags interactivos o pruebas automatizadas (fuera de alcance).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Convertir partes de la cabecera/página a cliente para controlar el modal puede afectar el render o la estructura actual de `/kids`. | Limitar el estado cliente al árbol mínimo necesario (p. ej. wrapper/header cliente) manteniendo datos y composición existentes; verificar que `/kids` se comporta igual salvo la apertura del modal. |
| La validación `dd/mm/aaaa` puede aceptar formatos ambiguos o rechazar fechas límite si es demasiado simple/estricta. | Implementar validación explícita de patrón y de fecha calendario válida (día/mes/año coherentes) con mensajes claros. |
| El modal puede no ser usable en móviles con pantallas bajas o con teclado en pantalla. | Usar contenedor con altura máxima, scroll interno y márgenes laterales; verificar manualmente en viewport móvil. |
| Los estilos/atributos de error pueden reducir la fidelidad al mock si no se definen. | Definir un estado de error discreto pero visible (borde/texto de error) consistente con la paleta del proyecto y verificarlo en los criterios de aceptación. |

## Lo que **no** está en esta spec

- Persistencia, APIs, base de datos o creación/edición real de niños.
- Búsqueda real, vinculación de padres, resumen del día u otras acciones de negocio.
- Chips/tags interactivos, selector de fecha nativo/custom avanzado o salas dinámicas.
- Pruebas automatizadas.

Cada uno de esos puntos, si se aborda, irá en su propia spec.
