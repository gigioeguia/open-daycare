# SPEC 05 — Modal “Vincular padre” (UI)

> **Estado:** Implementado  
> **Depende de:** SPEC 03 (perfil de niño)  
> **Fecha:** 2026-11-15  
> **Objetivo:** Agregar en el perfil `/kids/[id]` (p. ej. `/kids/mateo`) un modal de **“Vincular padre”**, basado en `references/pantallas/vincular-padre.dc.html`, activado desde **“Vincular otro padre”**, con formulario y validación en cliente (sin persistencia) y generación local de un código de invitación.

## Nota

- La imagen de referencia del disparador (`[Image 1]`) no fue procesable en esta sesión. Se toma como disparador el enlace **“Vincular otro padre”** en la tarjeta de padres del perfil (`app/components/kids/KidParentsCard.tsx`, actualmente `href="#"`). Si la ubicación/botón difiere del mock, ajustar en implementación.

## Alcance

**Incluye:**

- **Disparador (perfil del niño):** convertir el enlace “Vincular otro padre” de `KidParentsCard` en una acción que abra el modal, manteniendo el aspecto visual actual (icono `+` punteado + texto en acento). La apertura debe ser contextual al niño del perfil (el subtítulo del modal muestra `a {nombre del niño}`, ej. `a Mateo Fernández`).
- **UI del modal (fiel a `references/pantallas/vincular-padre.dc.html`):**
  - Overlay centrado, contenedor `max-width ~480px`, fondo/sombras/bordes/redondeos según referencia; cabecera con título **“Vincular padre”**, subtítulo `a {nombre del niño}` y botón cerrar (X).
  - Banner informativo: “Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {nombre del niño}.” (texto contextual al niño).
  - Campos: **Nombre del padre/madre** (input texto, placeholder `Ej. Diego Fernández`), **Email** (input email, placeholder `correo@ejemplo.com`), **Parentesco** (selector de opciones `Mamá | Papá | Tutor/a`).
  - Bloque **Código de invitación**: etiqueta “CÓDIGO DE INVITACIÓN”, código destacado, texto fijo **“Vence en 7 días”**.
  - CTA principal **“Enviar invitación”** (con ícono de envío) con estilo de gradiente/acento de la referencia.
- **Comportamiento y validación en cliente (al enviar, sin persistencia ni llamadas remotas):**
  - **Nombre del padre/madre (obligatorio):** no vacío tras recortar espacios; **solo letras y espacios en blanco** (aceptar letras Unicode con acentos/ñ, p. ej. `ÁÉÍÓÚÜÑáéíóúüñ`, para nombres reales). Rechazar dígitos y demás símbolos.
  - **Email (obligatorio):** no vacío y con **formato de email válido** (validación de máscara/patrón razonable; mensaje de error visible si no cumple).
  - **Parentesco (obligatorio):** debe haber una opción seleccionada (`Mamá`, `Papá` o `Tutor/a`). Estado inicial recomendado **sin preselección** para forzar elección; no se permite enviar sin parentesco.
  - **Código de invitación:** cadena aleatoria de **5 caracteres** alfanuméricos, generada en cliente al abrir el modal y estable mientras esté abierto; se regenera en cada apertura. Mostrar en mayúsculas.
  - **Vence en 7 días:** texto fijo, sin cálculo de fecha.
  - Si hay errores, el modal permanece abierto y muestra error visible por campo inválido (mensaje y/o borde/resaltado consistente con el proyecto). Si es válido, **“Enviar invitación”** simula éxito: cierra el modal sin persistir ni modificar la lista de padres.
- **Acciones de cierre:** botón `X`, clic en overlay y tecla `Esc` cierran el modal. Al cerrar por cualquier vía se limpian valores y errores del formulario; al reabrir se genera un **nuevo código** y el formulario vuelve a estado inicial.
- **Responsividad:** en móvil márgenes laterales y scroll interno si excede la altura; en escritorio centrado según referencia. Mantener fidelidad visual razonable al mock.
- **Organización de código (convenciones del proyecto):**
  - Componentes cliente finos en inglés en `app/components/kids/` (p. ej. `LinkParentModal.tsx`, y/o piezas de formulario/campo según convenga), reutilizando patrones de `AddChildModal`.
  - Tipos, etiquetas, placeholders, opciones de parentesco, mensajes de error y utilidades puras (validación nombre/email, generación de código 5 chars) en un módulo tipado en `app/components/kids/` (p. ej. `link-parent-form.ts`), análogo a `add-child-form.ts`.
  - Integrar el estado de apertura en `app/kids/[id]/page.tsx` (o wrapper cliente mínimo) pasando el nombre del niño al modal; `KidParentsCard` recibe un callback/prop para disparar apertura (en lugar de `href="#"`).

**Fuera de alcance (futuras specs):**

- Envío real de correo, creación de invitación, persistencia, API/base de datos o alta real del padre vinculado.
- Cálculo real de fecha de vencimiento, expiración, reenvío, copia al portapapeles o estado “invitación pendiente”.
- Lógica de permisos/acceso real del padre al feed.
- Edición/eliminación de padres vinculados.
- Pruebas automatizadas.

## Modelo de datos (UI, sin persistencia)

```ts
export type RelationshipOption = {
  value: "mother" | "father" | "guardian";
  label: "Mamá" | "Papá" | "Tutor/a";
};

export type LinkParentFormValues = {
  fullName: string;
  email: string;
  relationship: RelationshipOption["value"] | "";
};

export type LinkParentFormErrors = {
  fullName?: string;
  email?: string;
  relationship?: string;
};
```

**Contenido fijo / reglas:**

- Opciones de parentesco (orden): `Mamá`, `Papá`, `Tutor/a`.
- Placeholder nombre: `Ej. Diego Fernández`. Placeholder email: `correo@ejemplo.com`.
- Código: 5 caracteres alfanuméricos (`A-Z`, `0-9`), generado aleatoriamente al abrir.
- Texto de vencimiento: `Vence en 7 días` (constante).
- Mensajes de error orientativos (en español, módulo de datos): nombre requerido / “Solo letras y espacios”; email requerido / “Ingresá un email válido”; parentesco requerido.

## Plan de implementación

1. **Datos y utilidades (`link-parent-form.ts`).** Definir tipos, opciones de parentesco, labels/placeholders, valores iniciales, generador de código de 5 chars y validadores puros (nombre letras+espacios Unicode, email con formato válido, parentesco seleccionado). Verificación: módulo tipado, cubre vacío/inválido/válido.
2. **Componente modal (`LinkParentModal` + piezas).** Construir UI fiel a la referencia (cabecera con X, banner contextual, inputs, selector de parentesco tipo “pill/toggle”, bloque de código con vencimiento fijo, CTA). Estados controlados, errores por campo, cierre por X/overlay/Esc, reset al cerrar y regeneración de código al abrir. Verificación: render y comportamiento aislado.
3. **Integración en perfil `/kids/[id]`.** Hacer disparable “Vincular otro padre” desde `KidParentsCard` (callback) y orquestar estado open/close + nombre del niño en `app/kids/[id]/page.tsx` (wrapper cliente mínimo si es necesario) sin alterar el resto del perfil/listado. Verificación: en `/kids/mateo` abre el modal contextual; cierres limpian estado.
4. **Validación y responsive.** Flujo de “Enviar invitación” con validación; solo cierra en éxito simulado. Ajustar márgenes/scroll móvil y estados de foco/error. Verificación manual escritorio/móvil.
5. **Fidelidad y verificación técnica.** Pulir detalles visuales vs `vincular-padre.dc.html`. Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`.

## Criterios de aceptación

- [x] En `/kids/{id}` (p. ej. `/kids/mateo`), “Vincular otro padre” abre el modal con estructura/contenido de `references/pantallas/vincular-padre.dc.html`, título “Vincular padre” y subtítulo/banners contextualizados al nombre del niño. Verificado mediante `KidParentsSection`/`LinkParentModal` integrados en `app/kids/[id]/page.tsx` y `KidParentsCard` (disparador por callback).
- [x] **Nombre del padre/madre** es obligatorio y solo acepta letras (incl. acentos/ñ) y espacios; rechaza dígitos/símbolos y vacío con error visible. Implementado en `validateLinkParentForm` (`app/components/kids/link-parent-form.ts`, patrón Unicode `\p{L}` + espacios) con mensajes y estado de error por campo.
- [x] **Email** es obligatorio y debe cumplir formato de email válido; valores inválidos/vacíos muestran error visible.
- [x] **Parentesco** es obligatorio (`Mamá`, `Papá` o `Tutor/a`); no se puede enviar sin selección (estado inicial sin preselección).
- [x] Se muestra un **código de invitación** aleatorio de **5 caracteres** alfanuméricos y el texto fijo **“Vence en 7 días”**; el código se regenera en cada apertura (generación en inicialización del modal + remount por sesión al abrir).
- [x] Con errores, “Enviar invitación” no cierra el modal y marca campos inválidos; con datos válidos, cierra el modal sin persistir ni modificar la lista de padres.
- [x] `X`, clic en overlay y `Esc` cierran el modal; al cerrar se limpian valores/errores y el estado vuelve a inicial en la próxima apertura (remount por sesión).
- [x] Modal usable en móvil (márgenes laterales y `max-h` + `overflow-y-auto` interno) con fidelidad razonable al mock.
- [x] Sin persistencia, sin llamadas remotas ni cambios de comportamiento/datos en listado y perfil existentes. `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores nuevos.

> **Nota de verificación:** criterios de comportamiento validados por implementación y chequeos estáticos (`lint`, `tsc`, `build`). No se ejecutó recorrido interactivo automatizado con Playwright en esta sesión.

## Decisiones

- **Sí:** modal UI en perfil de niño con validación cliente y simulación de envío; código aleatorio 5 chars generado en cliente; vencimiento fijo “7 días”.
- **Sí:** validación de nombre restringida a letras y espacios (Unicode) según lo pedido; email por formato/máscara.
- **Sí:** parentesco sin preselección inicial para forzar elección explícita.
- **Sí:** reutilizar patrones de `AddChildModal` (overlay, cierre, reset, módulo `*-form.ts`).
- **No:** envío real, persistencia, fecha de vencimiento real, copiar código, o pruebas automatizadas.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Regex de “solo letras y espacios” puede excluir apóstrofos/guiones de nombres compuestos. | Usar validación Unicode de letras + espacios (`\p{L}`) y confirmar si se deben permitir `'` o `-`; por defecto ceñirse a lo pedido. |
| Validación de email demasiado estricta/laxa. | Patrón razonable de formato (no entrega garantizada) + mensaje claro; sin verificación de dominio. |
| Introducir cliente en `page.tsx`/árbol de perfil afecta RSC. | Limitar estado a un wrapper/componente cliente mínimo (patrón ya usado en `/kids` con `KidsPageHeader`). |
| Código con caracteres ambiguos (O/0, I/1) dificulta lectura. | Opcional: alfabeto sin ambiguos; por defecto alfanumérico A–Z/0–9 de 5 chars (ajustable). |

## Lo que **no** está en esta spec

- Persistencia/APIs/envío real, vencimiento calculado, gestión de invitaciones/padres, pruebas automatizadas.

Cada uno de esos puntos, si se aborda, irá en su propia spec.
