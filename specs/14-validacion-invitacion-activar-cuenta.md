# SPEC 14 — Validación de invitación en `/activar-cuenta` por URL

> **Estado:** Implementado  
> **Depende de:** SPEC 03, SPEC 12  
> **Fecha:** 2026-11-16  
> **Objetivo:** Validar al cargar `/activar-cuenta` que los parámetros `code` y `email` de la URL correspondan a una invitación válida en base de datos; si no, mostrar un estado de error “Invitación no válida” en lugar del formulario.

## Alcance

**Incluye:**

- **Validación al cargar la página (server-side, en `/activar-cuenta`):** antes de renderizar el formulario de activación, verificar que los query params `code` y `email` estén presentes y no vacíos (tras normalización consistente con el flujo existente, p. ej. `trim`/normalización de código y email) y que **exista en `public.invitations` una invitación válida** que coincida con ambos: `code` y `email` coincidentes (normalizados), `status = 'pending'` y `expires_at > now()`.
- **Caso válido (continuar):** si la validación pasa, la pantalla se comporta **sin cambios** respecto a SPEC 12 (formulario de activación prellenado con `code`/`email` editables, contraseña y consentimiento obligatorios, flujo de activación/creación de cuenta al enviar sin modificaciones).
- **Caso inválido (reemplazo del formulario, conservando encabezado):** si la validación falla, la página **no muestra el formulario** de activación (`ActivationForm`) y en su lugar renderiza, dentro de la misma composición de `/activar-cuenta`, un estado de error que conserva el **encabezado/branding** de la página (marca/logo, título y subtítulo existentes) y muestra el mensaje **“Invitación no válida”**. El mensaje es único y genérico para todos los casos inválidos (ver criterios). El estado de error incluye una acción de recuperación visible que enlaza a **`/login`** (p. ej. “Ir a iniciar sesión”), manteniendo legibilidad responsive.
- **Casos tratados como inválidos (mismo mensaje):** falta `code` o falta `email` en la URL (o ambos), parámetros presentes pero sin invitación coincidente, o invitación coincidente pero expirada, ya utilizada (`accepted`) o cancelada/no válida.
- **Ajustes necesarios en `app/activar-cuenta/page.tsx`** (y componentes/consultas server-side mínimos en `app/components/auth/` o utilidades existentes) para realizar la comprobación y renderizar condicionalmente el estado de error o el formulario actual.

**Fuera de alcance (futuras specs):**

- Cambios en el flujo de activación/envío del formulario, reglas de negocio de SPEC 12, ni en la vinculación de correos que ya tienen cuenta más allá de lo ya definido.
- Cambios en el email/enlace de invitación, en el modal “Vincular padre” ni en `/login`.
- Cambios de esquema, migraciones, RLS/policies, triggers, seeds o estructura de `public.invitations`.
- Diferenciación del mensaje por causa (expirada, usada, no encontrada, etc.) o exposición de detalles del estado de la invitación.
- Pruebas automatizadas.

## Modelo de datos

Esta feature no introduce nuevas estructuras ni migraciones. Reutiliza `public.invitations` (SPEC 07/12).

**Consulta/contrato de validación (server-side, lectura):**

- **Entrada:** `code` y `email` obtenidos de `searchParams` (valores crudos de la URL).
- **Normalización:** aplicar la misma lógica de normalización ya usada por el flujo de activación/invitaciones (código y email) para comparar de forma consistente.
- **Condición de validez:** existe un registro tal que `code` y `email` normalizados coinciden, `status = 'pending'` y `expires_at > now()`.
- **Resultado:** `válida` → renderizar flujo actual; `inválida` → renderizar estado “Invitación no válida”.
- **UI estado inválido:** componente/vista de error (p. ej. `app/components/auth/InvalidInvitationState.tsx`) con copy fijo **“Invitación no válida”** y acción de recuperación que enlaza a **`/login`**; se muestra en el área del formulario conservando el encabezado/branding de la página.

Convenciones: no exponer secretos; la validación es de lectura y no modifica datos.

## Plan de implementación

1. **Lógica de validación de invitación en servidor.** Agregar una función server-side (colocalizada en `app/activar-cuenta/` o utilidad reutilizable) que reciba `code`/`email` crudos, los normalice y consulte `public.invitations` para determinar si existe una invitación válida (`pending`, no expirada, `code`+`email` coincidentes). Retornar un resultado booleano/estado tipado sin filtrar la causa.  
   _Verificación:_ con params ausentes o sin coincidencia válida devuelve inválida; con invitación `pending` vigente y coincidente devuelve válida.

2. **Componente de estado “Invitación no válida”.** Crear un componente de UI en `app/components/auth/InvalidInvitationState.tsx` (nombre en inglés) que muestre el mensaje **“Invitación no válida”** y una acción de recuperación con enlace a **`/login`**, con estilos consistentes con la pantalla de activación y responsive.  
   _Verificación:_ el estado es legible en móvil/escritorio, muestra el mensaje acordado y permite navegar a `/login`.

3. **Render condicional en `app/activar-cuenta/page.tsx`.** En el Server Component (dentro del flujo que ya resuelve `searchParams`), ejecutar la validación y: si es válida, renderizar `ActivationForm` con `initialCode`/`initialEmail` como hoy; si es inválida, renderizar el estado de error en lugar del formulario conservando el encabezado/branding existente de la página. Mantener `Suspense`/`instant = false` y estructura de página según corresponda.  
   _Verificación:_ URL con invitación válida muestra el formulario prellenado; URL inválida no muestra campos de activación y conserva el encabezado con el mensaje y el enlace a `/login`.

4. **Verificación técnica y ajuste fino.** Revisar que no haya regresiones en el flujo válido (SPEC 12) ni exposición de detalles internos; ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`.  
   _Verificación:_ comandos finalizan sin errores y el comportamiento coincide con los criterios.

## Criterios de aceptación

- [x] Al acceder a `/activar-cuenta` sin `code`, sin `email`, o sin ambos en la URL, se muestra el estado de error con el mensaje **“Invitación no válida”** y **no** se renderiza el formulario de activación. (Verificado en render de localhost: `code=&email=ppeguia@gmail.com` renderiza “Invitación no válida” sin formulario.)
- [x] Al acceder con `code`/`email` presentes pero sin invitación coincidente válida en `public.invitations` (no existe, email no coincide, `status` distinto de `pending`, expirada o cancelada/aceptada), se muestra el mismo mensaje **“Invitación no válida”** y **no** se renderiza el formulario. (Implementado en `validation.ts` con retorno genérico `valid: false` sin exponer causa.)
- [x] El mensaje es genérico y no diferencia la causa del rechazo (no revela si el código existe, si expiró o si ya fue usado). (`validateActivationInvitation` devuelve solo `{ valid: false }`; ningún detalle de causa se filtra a la UI.)
- [x] El estado inválido conserva el encabezado/branding de la página `/activar-cuenta` (marca/logo, título y subtítulo) y muestra una acción de recuperación visible que enlaza a **`/login`**. (Verificado en HTML renderizado: encabezado/logo/título/subtítulo presentes, enlace “Ir a iniciar sesión” → `/login`.)
- [x] Al acceder con `code` y `email` que corresponden a una invitación válida (`pending`, no expirada, coincidencia normalizada), se muestra el formulario de activación prellenado y el flujo de envío/activación funciona **sin cambios** respecto a SPEC 12. (Verificado manualmente con invitación `pending` vigente en `public.invitations`.)
- [x] La validación se ejecuta al cargar la página en servidor (no depende de que el usuario envíe el formulario). (`page.tsx` es Server Component; `validateActivationInvitation` se invoca durante el render, antes de decidir entre `ActivationForm` y `InvalidInvitationState`.)
- [x] La pantalla se mantiene usable/responsive en los estados válido e inválido. (Clases Tailwind con `sm:`; build exitoso; sin overflow reportado.)
- [x] No se realizan cambios de esquema/migraciones/RLS ni modificaciones al flujo de `/login`, al email/enlace de invitación o al modal “Vincular padre”. (Solo `app/activar-cuenta/`, `app/components/auth/InvalidInvitationState.tsx` y spec; ninguna migración ni cambio de BD.)
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores. (Ejecutados: lint OK, tsc OK, build OK con ruta `◐ /activar-cuenta` generada.)

## Decisiones

- **Sí (1.b):** “Continuar” solo si los params `code` y `email` están presentes y corresponden a una invitación válida en BD (`pending`, `expires_at > now()`, `code`+`email` coincidentes con normalización consistente).
- **Sí (2.a):** validar al cargar la página en servidor; si es inválida, reemplazar la UI del formulario por un estado de error con mensaje **“Invitación no válida”** conservando el encabezado/branding de la página.
- **Sí (2.b):** la acción de recuperación del estado inválido enlaza a **`/login`**.
- **Sí (2.c):** el estado inválido conserva el encabezado/branding de `/activar-cuenta`; solo se sustituye el formulario por el mensaje/acción de error.
- **Sí (3, recomendación):** un único mensaje genérico **“Invitación no válida”** para params faltantes, invitación inexistente/no coincidente, expirada, aceptada o cancelada, sin filtrar causa.
- **Sí (4):** sin cambios al comportamiento del flujo cuando la invitación es válida (SPEC 12 se mantiene).
- **Sí (5, recomendación):** alcance limitado a `/activar-cuenta` (validación y estado de error); sin cambios en BD/migraciones/RLS, `/login`, email/enlace o modal de invitación.
- **No:** diferenciar mensajes por tipo de invalidez o mostrar el formulario cuando la invitación no es válida.
- **No:** validar únicamente al enviar el formulario como sustituto de esta comprobación inicial.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Normalización inconsistente de `code`/`email` entre la URL y la BD produce falsos inválidos o válidos. | Reutilizar/centralizar los helpers de normalización existentes del flujo de activación/invitaciones. |
| La consulta de validación en RSC usa un cliente sin permisos/contexto adecuado y falla o devuelve resultados incorrectos. | Realizar la lectura server-side con el cliente apropiado para leer `invitations` de forma fiable y manejar errores como estado inválido genérico. |
| El diseño visual del estado de error difiere de la referencia no disponible en esta conversación. | Implementar mensaje/acción y encabezado conservado según lo acordado; ajustar detalles visuales si se aporta la referencia. |
| Usuarios con enlace válido pero que ya completaron la activación verán “Invitación no válida”. | Aceptado por decisión de mensaje genérico; no se expone el estado `accepted` (comportamiento seguro). |

## Lo que **no** está en esta spec

- Cambios al envío/activación, a SPEC 12 o a la vinculación de cuentas ya existentes.
- Modificaciones en `/login`, en el correo/enlace de invitación o en el modal “Vincular padre”.
- Cambios de base de datos (esquema, migraciones, RLS/policies, seeds).
- Mensajes diferenciados por causa o pruebas automatizadas.

Cada uno de estos puntos, si se aborda, irá en su propia spec.
