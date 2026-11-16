# SPEC 13 — Flujo de invitación en modal "Vincular padre" (código diferido y resultado en modal)

> **Estado:** Implementado  
> **Depende de:** SPEC 05, SPEC 12  
> **Fecha:** 2026-11-16  
> **Objetivo:** Ajustar el modal "Vincular padre" y el email de invitación para que el código se genere en el servidor al enviar, no se muestre antes del envío, y el resultado (mensaje y código enviado) se presente dentro del modal con el código etiquetado como "Código de verificación" en el correo.

## Alcance

**Incluye:**

- **Modal "Vincular padre" (`/kids/[id]`, UI real):** mantener el disparador y la estructura visual general definidos en SPEC 05/12 (`KidParentsSection`, `LinkParentModal`, `KidParentsCard`), pero cambiar el flujo de invitación:
  - **Al abrir el modal:** no se genera ni se muestra ningún código de invitación. El formulario inicia en estado editable (nombre, email, parentesco) sin bloque de código visible previo al envío.
  - **Al enviar ("Enviar invitación"):** se validan los campos en cliente como hoy (nombre solo letras/espacios Unicode, email con formato válido, parentesco obligatorio). Si hay errores de validación, el modal permanece abierto mostrando errores inline por campo (comportamiento actual).
  - **Durante el envío:** botón "Enviar invitación" en estado de carga/disabled (comportamiento actual).
  - **En éxito:** el modal permanece abierto en **estado de resultado** (no se cierra automáticamente y no se muestra confirmación externa en el perfil). En este estado se ocultan los campos del formulario, el banner informativo, el CTA de envío y cualquier bloque de código previo al envío; se muestra un mensaje de resultado claro en español indicando que la invitación fue enviada (incluyendo el email destinatario) y se muestra de forma visible el **código de invitación enviado** (el devuelto por el servidor). Se incluye un botón explícito para cerrar el modal (p. ej. "Cerrar" o "Listo", con label en español definido en implementación).
  - **Cierre del modal:** el botón de cierre (X), clic en overlay, tecla `Esc` y el botón de cierre del estado de resultado cierran el modal. Al cerrar/reabrir se limpia el estado (valores, errores, estado de resultado/código mostrado) y el formulario vuelve a su estado inicial sin código generado, consistente con el patrón actual de reinicio por sesión (`modalSession`/remount) o equivalente.
- **Generación del código en servidor (Server Action de invitación):** modificar `app/kids/[id]/actions.ts` (`sendParentInvitation`) para que el **cliente no genere ni envíe** el código de invitación:
  - La acción deja de requerir/validar un `code` provisto por el cliente y pasa a generar un código único de 5 caracteres alfanuméricos en mayúsculas (`A-Z0-9`) en el servidor al procesar el envío, usando la utilidad existente `generateUniqueInvitationCode` (o equivalente con reintentos ante colisión) sobre `public.invitations`.
  - La acción mantiene las reglas vigentes de SPEC 12: validación de sesión/entrada, resolución del niño en servidor, rechazo si el padre ya está vinculado ("Este padre ya está vinculado a este niño."), detección y **reemisión** de invitación `pending` no expirada para el mismo `child_id` + email normalizado (actualizando código, datos, `expires_at = now() + 7 días`, `status='pending'`, `accepted_at=null`, `invited_by`), o creación de nueva invitación en caso contrario.
  - En éxito, la respuesta tipada incluye el `code` generado/enviado (además de `email` y `reissued` según corresponda) para que el modal pueda mostrarlo en el estado de resultado.
  - **Colisiones/unicidad:** se resuelven en servidor mediante generación con reintentos/garantía de unicidad. Se eliminan los flujos y mensajes orientados a "el código ya está en uso, cerrá y reabrí el modal" (cliente/servidor). No se requiere intervención de cerrar/reabrir por colisión.
- **Manejo de errores al enviar:** si la acción devuelve error (validación de campos, conflicto "ya vinculado", fallo Resend/BD u otro error de servidor), el modal permanece abierto con los **campos del formulario visibles** y los valores ingresados preservados, mostrando errores inline por campo y/o mensaje general en español (comportamiento actual), permitiendo reintentar el envío sin cerrar el modal.
- **Confirmación en el perfil:** eliminar/ajustar el aviso de éxito externo en `KidParentsSection` para que, en el flujo exitoso de esta spec, **no** se muestre el mensaje "Invitación enviada a {email}" en el perfil (la confirmación queda dentro del modal). El perfil mantiene la lista de padres sin cambios salvo lo que ya soporte la app (el padre se vincula al aceptar).
- **Email de invitación (cuerpo):** actualizar el contenido en `utils/invitations.ts` (`composeInvitationEmail` y/o texto asociado) para etiquetar explícitamente el código como **"Código de verificación"** en el cuerpo HTML y en el texto plano, manteniendo el mismo dato (código de 5 caracteres), su visibilidad junto a la vigencia (7 días) y el enlace de activación `/activar-cuenta?code=...&email=...`, idioma español y envío vía Resend sin exponer claves al cliente.
- **Ajustes de utilidades/tipos y copy de UI necesarios:** actualizar `app/components/kids/link-parent-form.ts` (labels/placeholders/estado), tipos/props/contratos entre `LinkParentModal`, `KidParentsSection` y la Server Action para reflejar el nuevo flujo (p. ej. resultado de éxito con código, ausencia de código pre-envío, labels del estado de resultado), preservando fidelidad visual razonable y accesibilidad.

**Fuera de alcance (futuras specs):**

- Cambios en `/activar-cuenta` (flujo, validaciones, UI o copy), más allá de que ya consume el código/enlace existentes.
- Cambios de esquema, migraciones nuevas, RLS/policies, triggers o seeds de base de datos.
- Cambios en las reglas de negocio de persistencia/aceptación de invitaciones no descritos (vigencia 7 días, reemisión mismo niño+email pendiente no expirada, vínculo en `parent_children` al aceptar, rechazo por ya vinculado).
- Vincular padres que ya tienen cuenta, gestión/cancelación/listado de invitaciones, expiración automática por job, o visualización de invitaciones pendientes.
- React Email, plantillas en dashboard de Resend, adjuntos o tracking avanzado.
- Pruebas automatizadas (E2E/unitarias) más allá de verificación manual/técnica indicada.

## Modelo de datos

No se introducen tablas, columnas, enums ni migraciones nuevas. Se reutilizan las estructuras existentes (SPEC 07/12): `public.invitations`, `public.parent_children`, `public.children`, `public.rooms`, `public.daycares`, `public.users`, `auth.users`.

**Modelo/contratos de UI y acción (ajuste):**

```ts
// Contrato de resultado de la Server Action (ajustado): el código lo genera el servidor
export type SendParentInvitationResult =
  | {
      ok: true;
      email: string;
      code: string; // código generado/enviado por el servidor
      reissued: boolean;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        fullName?: string;
        email?: string;
        relationship?: string;
      };
    };
```

- **Entrada de la acción (ajuste):** `sendParentInvitation` recibe `childId`, `fullName`, `email`, `relationship` (sin `code` del cliente).
- **Estado de UI del modal:** el modal maneja al menos estados de edición, envío (carga), error (campos visibles) y éxito (campos ocultos, mensaje + código devuelto + acción de cierre). No existe estado de código visible previo al envío.
- **Email:** el cuerpo (HTML y texto) incluye la etiqueta/texto "Código de verificación" asociado al código, además de vigencia y enlace de activación.

Convenciones: código 5 caracteres `[A-Z0-9]`, único en `invitations.code`, generado en servidor; email normalizado para comparación/persistencia; vigencia `now() + interval '7 days'` al crear o reemitir.

## Plan de implementación

1. **Server Action y generación de código en servidor (`app/kids/[id]/actions.ts`, `utils/invitations.ts`).** Ajustar `sendParentInvitation` para eliminar `code` de la entrada del cliente y la validación/mensajes de colisión basados en código cliente ("código inválido/cierra y reabre"); generar el código único en servidor (p. ej. `generateUniqueInvitationCode` con cliente apropiado para la verificación/creación según permisos) al crear o reemitir, persistirlo y devolverlo en el resultado exitoso. Mantener validaciones de sesión/entrada, normalización de email, resolución de niño/contexto, reglas de "ya vinculado", reemisión/creación, vigencia 7 días y envío de correo.  
   _Verificación:_ invocar la acción con datos válidos crea/reemite invitación con código generado en servidor y devuelve `{ ok: true, code, email, ... }` sin requerir código del cliente.

2. **Copy del email (`utils/invitations.ts`).** Actualizar `composeInvitationEmail` (HTML y texto) para etiquetar el código como "Código de verificación" de forma clara y visible, conservando código, vigencia y enlace de activación.  
   _Verificación:_ el asunto/cuerpo generado contiene la etiqueta "Código de verificación" y el código en HTML y texto plano.

3. **Modal y estado de resultado (`app/components/kids/LinkParentModal.tsx`, `app/components/kids/link-parent-form.ts`).** Eliminar la generación/visualización del código al abrir y el envío de `code` desde el formulario. Implementar el estado de éxito dentro del modal: al recibir resultado exitoso, ocultar campos/banner/CTA/bloque de código previo y mostrar mensaje de confirmación con el email y el código devuelto, más un botón explícito para cerrar. Preservar carga/disabled durante envío, errores inline con campos visibles y valores preservados en fallo, y reseteo completo al cerrar/reabrir. Ajustar labels/copy necesarios (incluido el botón de cierre del resultado).  
   _Verificación:_ al abrir no hay código; tras envío exitoso se ven mensaje y código devuelto con opción de cerrar; en error los campos siguen visibles para reintentar.

4. **Integración en perfil (`app/components/kids/KidParentsSection.tsx`, y ajuste mínimo de props si aplica).** Adaptar el manejo de éxito para que la confirmación no se muestre como mensaje externo en el perfil (eliminar el toast/aviso "Invitación enviada a {email}" en esta ruta de éxito) y mantener el comportamiento de apertura/cierre del modal y la tarjeta de padres sin cambios funcionales no relacionados.  
   _Verificación:_ tras un envío exitoso y cierre del modal no queda mensaje externo en el perfil.

5. **Limpieza y verificación técnica.** Remover código muerto relacionado con código cliente/mensajes de colisión por "cerrar y reabrir" y alinear tipos/contratos. Ejecutar `npm run lint`, `npx tsc --noEmit` y `npm run build`.  
   _Verificación:_ lint, typecheck y build finalizan sin errores.

## Criterios de aceptación

- [x] Al abrir el modal "Vincular padre" en `/kids/[id]` no se genera ni se muestra ningún código de invitación; el formulario se presenta sin bloque de código previo al envío.
- [x] Al enviar con datos válidos, `sendParentInvitation` genera en el servidor un código único de 5 caracteres `[A-Z0-9]`, crea o reemite la invitación según las reglas vigentes (mismo niño+email pendiente no expirada), envía el correo y devuelve el código en la respuesta exitosa sin requerir código del cliente.
- [x] En un envío exitoso el modal permanece abierto en estado de resultado: se ocultan los campos del formulario (y el CTA de envío/bloques previos al envío) y se muestra un mensaje de confirmación en español con el email destinatario y el **código enviado** devuelto por el servidor, junto a un botón explícito para cerrar el modal.
- [x] En el flujo exitoso no se muestra el mensaje externo "Invitación enviada a {email}" en el perfil; la confirmación queda dentro del modal hasta que el usuario lo cierre.
- [x] El botón de cierre (X), clic en overlay, tecla `Esc` y el botón de cierre del estado de resultado cierran el modal; al reabrir el formulario vuelve a su estado inicial sin código generado ni resultado previo.
- [x] Si el envío falla (validación, "ya vinculado", fallo de correo/BD u otro error), el modal permanece abierto con los campos visibles y valores preservados, muestra errores inline/mensaje general en español y permite reintentar; no se requiere cerrar y reabrir el modal por colisión de código.
- [x] El correo de invitación etiqueta el código como "Código de verificación" en el cuerpo HTML y en el texto plano, manteniendo el código, la vigencia (7 días) y el enlace de activación.
- [x] No se realizan cambios en `/activar-cuenta` ni en el esquema/migraciones de la base de datos.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores.

## Decisiones

- **Sí (1.a):** en éxito el modal permanece abierto en estado de resultado (campos ocultos, mensaje + código enviado visible) con botón explícito para cerrar; no se muestra confirmación externa en el perfil.
- **Sí (2.a):** el código se genera en el servidor al procesar el envío (único, con reintentos ante colisión) y se devuelve en la respuesta exitosa; el cliente no genera ni envía el código ni lo muestra antes del envío.
- **Sí (3.a):** el cuerpo del email (HTML y texto) etiqueta explícitamente el código como "Código de verificación", manteniendo código, vigencia y enlace.
- **Sí (4.1.a):** alcance limitado al modal "Vincular padre", copy/contenido del email y ajustes mínimos de Server Action/utilidades necesarios; sin cambios en `/activar-cuenta`, sin migraciones/esquema y sin alterar reglas de persistencia/reemisión más allá de lo imprescindible.
- **Sí (4.2.a):** en error se mantienen visibles los campos con errores inline/mensaje para reintentar; se elimina el flujo/mensaje de "cerrar y reabrir por colisión de código" y la unicidad se resuelve/reintenta en servidor.
- **No:** generar o mostrar el código al abrir el modal.
- **No:** cerrar automáticamente el modal en éxito o duplicar la confirmación en el perfil.
- **No:** modificar `/activar-cuenta`, la base de datos o introducir gestión avanzada de invitaciones.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La generación de código en servidor falla por colisiones repetidas o error de consulta. | Reutilizar `generateUniqueInvitationCode` con reintentos acotados y devolver error general reintentable sin pedir cerrar/reabrir el modal. |
| Desalineación del contrato acción↔UI (código ahora en respuesta, no en entrada) rompe tipos o el flujo. | Actualizar tipos/props (`SendParentInvitationResult`, llamada desde el modal) y compilar con `tsc`/`build`. |
| El estado de resultado dentro del modal reduce claridad sobre cómo salir o reabrir para otra invitación. | Incluir botón explícito de cierre, mantener X/overlay/Esc y resetear completamente el estado al reabrir. |
| Cambio de copy del email ("Código de verificación") genera inconsistencia con textos existentes en UI/activación. | Limitar el cambio al cuerpo del email en esta spec (alcance acordado) y mantener el valor/código funcional sin tocar `/activar-cuenta`. |
| Remover el aviso externo en el perfil oculta feedback si el usuario cierra el modal sin notar el resultado. | Mostrar el resultado de forma prominente dentro del modal antes de que el usuario lo cierre (estado de éxito persistente hasta acción explícita). |

## Lo que **no** está en esta spec

- Cambios en la pantalla/flujo `/activar-cuenta` o en la activación de cuentas.
- Migraciones, cambios de esquema, RLS/policies o modificaciones de BD.
- Alteraciones a reglas de vigencia, reemisión, aceptación o vinculación en `parent_children` fuera de lo necesario para generar el código en servidor.
- Vinculación de cuentas existentes, gestión/cancelación/reenvío administrativo de invitaciones o expiración automática.
- Personalización avanzada de correos (React Email, plantillas de Resend, tracking) o pruebas automatizadas.

Cada uno de estos puntos, si se aborda, irá en su propia spec.
