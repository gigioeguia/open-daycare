export type AuthTextFieldData = {
  id: string;
  label: string; // "EMAIL", "CONTRASEÑA", etc.
  type: "text" | "email" | "password";
  name: string;
  value?: string; // valor inicial fijo de UI (sin persistencia)
  placeholder?: string;
  variant?: "default" | "highlight";
  letterSpacing?: boolean; // p. ej. código de invitación
};

export type BrandPanelData = {
  brandName: string; // "OpenDayCare"
  title: string; // "El día de cada niño,\ncompartido con su familia."
  description: string;
  contextLabel: string; // "Guardería Sala Soles"
};

export type LoginPageData = {
  title: string; // "Iniciar sesión"
  subtitle: string; // "Ingresá para ver el día de hoy."
  emailField: AuthTextFieldData;
  passwordField: AuthTextFieldData;
  forgotPasswordLabel: string; // "¿Olvidaste tu contraseña?"
  forgotPasswordHref: string; // "#"
  submitLabel: string; // "Iniciar sesión"
  submitHref: string; // "/"
  invitePrompt: string; // "¿Te invitó la guardería?"
  inviteLinkLabel: string; // "Activá tu cuenta"
  inviteHref: string; // "/activar-cuenta"
  brandPanel: BrandPanelData;
};

export type InvitationSummaryData = {
  promptLabel: string; // "Te invitaron a seguir a"
  childLabel: string; // "Mateo · Sala Soles"
  initial: string; // "M"
  avatarBackground: string; // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
};

export type ConsentNoticeData = {
  text: string; // texto de autorización
  checked: boolean; // siempre true en UI estática
};

export type ActivateAccountPageData = {
  title: string; // "Bienvenida a OpenDayCare"
  subtitle: string;
  invitation: InvitationSummaryData;
  codeField: AuthTextFieldData;
  emailField: AuthTextFieldData;
  passwordField: AuthTextFieldData;
  consent: ConsentNoticeData;
  submitLabel: string; // "Activar mi cuenta"
  submitHref: string; // "/"
  loginPrompt: string; // "¿Ya tenés cuenta?"
  loginLinkLabel: string; // "Iniciar sesión"
  loginHref: string; // "/login"
};

export const loginPageData: LoginPageData = {
  title: "Iniciar sesión",
  subtitle: "Ingresá para ver el día de hoy.",
  emailField: {
    id: "login-email",
    label: "EMAIL",
    type: "email",
    name: "email",
    value: "caro@opendaycare.com",
  },
  passwordField: {
    id: "login-password",
    label: "CONTRASEÑA",
    type: "password",
    name: "password",
    placeholder: "••••••••",
  },
  forgotPasswordLabel: "¿Olvidaste tu contraseña?",
  forgotPasswordHref: "#",
  submitLabel: "Iniciar sesión",
  submitHref: "/",
  invitePrompt: "¿Te invitó la guardería?",
  inviteLinkLabel: "Activá tu cuenta",
  inviteHref: "/activar-cuenta",
  brandPanel: {
    brandName: "OpenDayCare",
    title: "El día de cada niño,\ncompartido con su familia.",
    description:
      "Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar.",
    contextLabel: "🌿 Guardería Sala Soles",
  },
};

export const activateAccountPageData: ActivateAccountPageData = {
  title: "Bienvenida a OpenDayCare",
  subtitle:
    "Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.",
  invitation: {
    promptLabel: "Te invitaron a seguir a",
    childLabel: "Mateo · Sala Soles",
    initial: "M",
    avatarBackground: "#A9D9E8",
    avatarColor: "#1F7A93",
  },
  codeField: {
    id: "activate-code",
    label: "CÓDIGO DE INVITACIÓN",
    type: "text",
    name: "invitationCode",
    value: "7K4P9",
    letterSpacing: true,
  },
  emailField: {
    id: "activate-email",
    label: "EMAIL",
    type: "email",
    name: "email",
    value: "lucia.fernandez@gmail.com",
  },
  passwordField: {
    id: "activate-password",
    label: "CREAR CONTRASEÑA",
    type: "password",
    name: "password",
    value: "contraseña",
    variant: "highlight",
  },
  consent: {
    text: "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.",
    checked: true,
  },
  submitLabel: "Activar mi cuenta",
  submitHref: "/",
  loginPrompt: "¿Ya tenés cuenta?",
  loginLinkLabel: "Iniciar sesión",
  loginHref: "/login",
};
