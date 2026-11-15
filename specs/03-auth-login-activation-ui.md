# SPEC 03 — Pantallas de login y activación de cuenta (UI)

> **Estado:** Implementado  
> **Depende de:** SPEC 01, SPEC 02  
> **Fecha:** 2026-11-14  
> **Objetivo:** Implementar en OpenDayCare las pantallas de login y activación de cuenta basadas en `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html`, solo como interfaces y componentes reutilizables, responsivas y sin lógica de negocio ni persistencia.

## 1. Por qué existe esta spec

La app necesita las vistas de acceso (inicio de sesión y activación por invitación) como base visual y de componentes para futuros flujos de autenticación, manteniendo fidelidad con las referencias provistas y reutilizando la base técnica del proyecto (Next.js App Router, Tailwind/CSS, tipografías y tokens existentes) sin introducir comportamiento de negocio.

## Alcance

**Incluye:**

- Crear las rutas App Router `app/login/page.tsx` y `app/activar-cuenta/page.tsx` como composiciones finas de UI.
- Crear componentes reutilizables en `app/components/auth/` (primitivas y bloques de pantalla) con nombres en inglés y datos/textos centralizados y tipados en `app/components/auth/auth-data.ts`.
- **Login (`/login`)**, basado en `references/pantallas/login.dc.html` con el ajuste acordado:
  - Layout split en escritorio: panel de marca izquierdo (degradado, logo/sol, nombre "OpenDayCare", titular, descripción y contexto "Guardería Sala Soles") y formulario derecho.
  - Formulario con título "Iniciar sesión", subtítulo, campos `EMAIL` y `CONTRASEÑA`, enlace "¿Olvidaste tu contraseña?", CTA "Iniciar sesión" y texto/enlace "¿Te invitó la guardería? Activá tu cuenta".
  - **No se implementa** el bloque "INGRESO COMO" ni los botones Personal/Familia; el email se muestra como valor inicial fijo de UI (`caro@opendaycare.com`) sin cambio dinámico.
- **Activar cuenta (`/activar-cuenta`)**, fiel a `references/pantallas/activar-cuenta.dc.html`:
  - Pantalla centrada con marca/logo, título, descripción, tarjeta de invitación ("Te invitaron a seguir a" · "Mateo · Sala Soles"), campos `CÓDIGO DE INVITACIÓN`, `EMAIL`, `CREAR CONTRASEÑA`, aviso de consentimiento marcado y CTA "Activar mi cuenta" con enlace "¿Ya tenés cuenta? Iniciar sesión".
  - El checkbox/consentimiento se renderiza como estado visual marcado estático (sin toggle), reproduciendo el mockup.
- Layout 100% responsivo:
  - Login: en pantallas pequeñas una sola columna priorizando el formulario; el panel de marca se oculta o se reduce a una cabecera/branding compacto superior (sin perder legibilidad del acceso).
  - Activar cuenta: mantiene composición centrada y legible en móvil con espaciados/padding adaptados.
- Navegación de UI del alcance (con `next/link` donde corresponda):
  - Login: "¿Te invitó la guardería? Activá tu cuenta" → `/activar-cuenta`; CTA "Iniciar sesión" → `/`; "¿Olvidaste tu contraseña?" → `#` (sin acción real).
  - Activar cuenta: CTA "Activar mi cuenta" → `/`; "¿Ya tenés cuenta? Iniciar sesión" → `/login`.
- Fidelidad visual a las referencias: paleta, gradientes, tipografías (`Fredoka`/`Nunito`), espaciados, radios, bordes, sombras y jerarquía, usando valores de color/medida de los mockups (hex/arbitrary values en Tailwind cuando haga falta) y la base de `app/globals.css`; SVGs/iconos necesarios extraídos como componentes reutilizables (sin SVGs inline duplicados en JSX).
- Contenido ficticio hardcodeado en español según referencias/ajuste acordado.

**Fuera de alcance (para futuras specs):**

- Autenticación real, validación de credenciales/código, submit real, manejo de errores, sesiones, permisos o cierre de sesión.
- Base de datos, API, persistencia, fetch de datos o estado remoto.
- Selector/flujo "Ingreso como: Personal/Familia" y cualquier lógica de cambio de rol/destino.
- Recuperación de contraseña real, verificación de invitación/código, creación real de cuenta o aceptación persistida de consentimiento.
- Integración con `AppShell`/sidebar (estas pantallas son de acceso, fuera del shell autenticado) y cambios en rutas/componentes existentes (`/`, `/kids`, feed, shell) salvo que sea estrictamente necesario (no previsto).
- Rutas de familia (`familia-feed`, etc.), páginas placeholder adicionales, internacionalización, modo oscuro o pruebas automatizadas.

## Modelo de datos

Esta feature no introduce persistencia ni lógica de negocio; define tipos y constantes locales de UI para render estático en `app/components/auth/auth-data.ts`.

```ts
// app/components/auth/auth-data.ts
export type AuthTextFieldData = {
  id: string;
  label: string;          // "EMAIL", "CONTRASEÑA", etc.
  type: "text" | "email" | "password";
  name: string;
  value?: string;         // valor inicial fijo de UI (sin persistencia)
  placeholder?: string;
  variant?: "default" | "highlight";
  letterSpacing?: boolean; // p. ej. código de invitación
};

export type BrandPanelData = {
  brandName: string;      // "OpenDayCare"
  title: string;          // "El día de cada niño,\ncompartido con su familia."
  description: string;
  contextLabel: string;   // "Guardería Sala Soles"
};

export type LoginPageData = {
  title: string;          // "Iniciar sesión"
  subtitle: string;       // "Ingresá para ver el día de hoy."
  emailField: AuthTextFieldData;
  passwordField: AuthTextFieldData;
  forgotPasswordLabel: string; // "¿Olvidaste tu contraseña?"
  forgotPasswordHref: string;  // "#"
  submitLabel: string;    // "Iniciar sesión"
  submitHref: string;     // "/"
  invitePrompt: string;   // "¿Te invitó la guardería?"
  inviteLinkLabel: string;// "Activá tu cuenta"
  inviteHref: string;     // "/activar-cuenta"
  brandPanel: BrandPanelData;
};

export type InvitationSummaryData = {
  promptLabel: string;    // "Te invitaron a seguir a"
  childLabel: string;     // "Mateo · Sala Soles"
  initial: string;        // "M"
  avatarBackground: string; // "#A9D9E8"
  avatarColor: string;      // "#1F7A93"
};

export type ConsentNoticeData = {
  text: string;           // texto de autorización
  checked: boolean;       // siempre true en UI estática
};

export type ActivateAccountPageData = {
  title: string;          // "Bienvenida a OpenDayCare"
  subtitle: string;
  invitation: InvitationSummaryData;
  codeField: AuthTextFieldData;
  emailField: AuthTextFieldData;
  passwordField: AuthTextFieldData;
  consent: ConsentNoticeData;
  submitLabel: string;    // "Activar mi cuenta"
  submitHref: string;     // "/"
  loginPrompt: string;    // "¿Ya tenés cuenta?"
  loginLinkLabel: string; // "Iniciar sesión"
  loginHref: string;      // "/login"
};
```

**Contenido ficticio fijo (fiel a referencias y decisiones):**

- **Login (`loginPageData`):** título "Iniciar sesión"; subtítulo "Ingresá para ver el día de hoy."; email inicial `caro@opendaycare.com`; contraseña con placeholder/valor visual del mockup (sin lógica); "¿Olvidaste tu contraseña?" → `#`; CTA "Iniciar sesión" → `/`; "¿Te invitó la guardería?" + "Activá tu cuenta" → `/activar-cuenta`. Panel de marca: "OpenDayCare", "El día de cada niño, / compartido con su familia.", descripción y contexto "🌿 Guardería Sala Soles" (o equivalente textual/visual fiel).
- **Activar cuenta (`activateAccountPageData`):** título "Bienvenida a OpenDayCare"; subtítulo de invitación; invitación `M`, "Mateo · Sala Soles", colores de avatar de la referencia; código `7K4P9`; email `lucia.fernandez@gmail.com`; contraseña con valor visual del mockup; consentimiento marcado con texto "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app."; CTA "Activar mi cuenta" → `/`; "¿Ya tenés cuenta?" + "Iniciar sesión" → `/login`.

## Plan de implementación

1. **Datos y tipos de auth.** Crear `app/components/auth/auth-data.ts` con los tipos y las exportaciones `loginPageData` y `activateAccountPageData` (contenido ficticio fijo y destinos acordados). Verificación: módulo tipado sin errores y consume los valores de las referencias/decisiones.
2. **Primitivas e iconos reutilizables.** Crear en `app/components/auth/` los componentes de UI compartidos necesarios (nombres orientativos, ajustables si se mantiene la responsabilidad fina): `AuthLogoMark.tsx` (o icono sol reutilizable), `AuthTextField.tsx`, `AuthPrimaryButton.tsx`/`AuthLinkButton.tsx`, `BrandPanel.tsx`, `InvitationSummary.tsx`, `ConsentNotice.tsx` (estático marcado). Extraer SVGs usados a componentes reutilizables. Verificación: piezas renderizan estilos fieles (colores, bordes, gradientes, tipografía) al integrarlas.
3. **Pantalla de login.** Crear `app/login/page.tsx` y componer el layout split de escritorio con `BrandPanel` + formulario (sin selector Personal/Familia, con email fijo de UI), aplicando responsive recomendado (en móvil una sola columna que prioriza el formulario y oculta/reduce el panel de marca a branding compacto). Conectar enlaces/CTA según mapeo (`/activar-cuenta`, `/`, `#`). Verificación: `/login` es visualmente fiel al mockup ajustado y usable en móvil/escritorio.
4. **Pantalla de activar cuenta.** Crear `app/activar-cuenta/page.tsx` y componer la vista centrada con invitación, campos, consentimiento estático marcado y acciones, conectando CTA a `/` y enlace a `/login`. Ajustar responsive para legibilidad en pantallas pequeñas. Verificación: `/activar-cuenta` es visualmente fiel a `references/pantallas/activar-cuenta.dc.html`.
5. **Ajuste fino y validación.** Pulir detalles (gradientes, sombras, foco visual, espaciados, tamaños de SVG, comportamiento responsive y consistencia entre ambas pantallas). Verificación final: comparación visual contra `references/pantallas/login.dc.html` (con ajuste de rol omitido) y `references/pantallas/activar-cuenta.dc.html`; `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores.

## Criterios de aceptación

- [x] Existen las rutas `app/login/page.tsx` y `app/activar-cuenta/page.tsx` y renderizan las pantallas de acceso (solo UI/componentes, sin lógica de negocio ni persistencia).
- [x] `/login` reproduce la estructura visual de `references/pantallas/login.dc.html` **sin** el bloque "INGRESO COMO"/Personal-Familia: panel de marca en escritorio, formulario con email inicial `caro@opendaycare.com`, contraseña, "¿Olvidaste tu contraseña?" y CTA "Iniciar sesión".
- [x] `/activar-cuenta` reproduce la estructura y contenido de `references/pantallas/activar-cuenta.dc.html`: marca, título/subtítulo, invitación "M / Mateo · Sala Soles", código `7K4P9`, email `lucia.fernandez@gmail.com`, campo de contraseña, consentimiento marcado estático y CTA "Activar mi cuenta".
- [x] Navegación del alcance funciona: login "Activá tu cuenta" → `/activar-cuenta`, login CTA "Iniciar sesión" → `/`, login "¿Olvidaste tu contraseña?" → `#`, activar CTA "Activar mi cuenta" → `/`, activar "Iniciar sesión" → `/login`.
- [x] Ambas pantallas son 100% responsivas: `/login` prioriza el formulario en móvil (panel de marca oculto o reducido a branding compacto) y `/activar-cuenta` se mantiene centrada/legible sin overflow horizontal roto.
- [x] El contenido ficticio y los tipos están centralizados en `app/components/auth/auth-data.ts`; los componentes están descompuestos en archivos finos con nombres en inglés bajo `app/components/auth/` y los SVGs se reutilizan como componentes (sin SVGs inline duplicados).
- [x] No se introduce lógica de negocio, validación, submit real, fetch, persistencia ni selector de rol; el alcance de archivos se limita a `app/login/page.tsx`, `app/activar-cuenta/page.tsx` y nuevos archivos en `app/components/auth/` (sin cambios en rutas/shell/feed existentes).
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` finalizan sin errores.

## Decisiones

- **Sí:** una sola spec para login y activar cuenta por ser el mismo flujo de acceso y compartir primitivas visuales.
- **Sí:** componentes reutilizables y datos tipados en `app/components/auth/` (`auth-data.ts` + primitivas/bloques) con páginas finas en App Router.
- **Sí:** mapeo de navegación: login "Activá tu cuenta" → `/activar-cuenta`, login CTA → `/`, login "¿Olvidaste tu contraseña?" → `#`, activar CTA → `/`, activar "Iniciar sesión" → `/login`.
- **Sí:** responsive de login priorizando el formulario en móvil (panel de marca oculto o reducido a branding compacto).
- **Sí:** omitir por completo "INGRESO COMO: Personal/Familia" y mantener email inicial fijo `caro@opendaycare.com` como valor estático de UI.
- **Sí:** consentimiento de activar cuenta como visual marcado estático (sin toggle ni persistencia).
- **Sí:** fidelidad visual a los mockups con valores de referencia (hex/gradientes/sombras) y fuentes existentes del proyecto; SVGs como componentes reutilizables.
- **Sí:** alcance aislado a nuevas rutas/componentes de auth, sin modificar shell/feed/kids existentes.
- **No:** lógica de negocio, autenticación real, validación, persistencia, fetch, selector de rol, rutas de familia/recuperación funcionales o integración con `AppShell`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Omitir el selector Personal/Familia altera el mockup de login y puede dejar un vacío visual. | Definir explícitamente la estructura resultante (sin bloque de rol, email fijo `caro@opendaycare.com`) y ajustar espaciados para mantener jerarquía y fidelidad del resto del formulario. |
| El panel de marca en móvil puede competir con el formulario o generar overflow. | Aplicar la decisión acordada: en móvil ocultar o reducir el panel a branding compacto y priorizar el formulario; verificar ausencia de overflow horizontal. |
| Diferencias de render entre estilos inline del mockup y Tailwind/Next (gradientes, sombras, pesos). | Usar valores de las referencias (`Fredoka`/`Nunito`, hex y medidas indicadas) y comparar visualmente contra ambos HTML. |
| Duplicación de primitivas (inputs/botones) entre pantallas. | Extraer componentes compartidos en `app/components/auth/` y consumirlos desde ambas páginas. |

## Lo que **no** está en esta spec

- Autenticación real, sesiones, permisos, validación, submit o manejo de errores.
- Base de datos, APIs, persistencia o carga dinámica de datos.
- Selector Personal/Familia, recuperación de contraseña funcional o activación/invitación real.
- Rutas/pantallas de familia, cambios al `AppShell`/feed/kids u otras pantallas existentes.
- Modo oscuro, theming configurable, internacionalización o pruebas automatizadas.

Cada uno de esos puntos, si se aborda, irá en su propia spec.
