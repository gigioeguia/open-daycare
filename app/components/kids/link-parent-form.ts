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

export const relationshipOptions: RelationshipOption[] = [
  { value: "mother", label: "Mamá" },
  { value: "father", label: "Papá" },
  { value: "guardian", label: "Tutor/a" },
];

export const linkParentFormLabels = {
  title: "Vincular padre",
  subtitlePrefix: "a",
  close: "Cerrar",
  infoBanner: (childName: string) =>
    `Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de ${childName}.`,
  fullName: "NOMBRE DEL PADRE/MADRE",
  email: "EMAIL",
  relationship: "PARENTESCO",
  invitationCode: "CÓDIGO DE INVITACIÓN",
  expiresIn: "Vence en 7 días",
  submit: "Enviar invitación",
};

export const linkParentFormPlaceholders = {
  fullName: "Ej. Diego Fernández",
  email: "correo@ejemplo.com",
};

export const linkParentFormErrorMessages = {
  fullNameRequired: "Ingresá el nombre del padre/madre.",
  fullNameInvalid: "Solo se permiten letras y espacios.",
  emailRequired: "Ingresá el email.",
  emailInvalid: "Ingresá un email válido.",
  relationshipRequired: "Seleccioná un parentesco.",
};

export const initialLinkParentFormValues: LinkParentFormValues = {
  fullName: "",
  email: "",
  relationship: "",
};

const NAME_PATTERN = /^[\p{L} ]+$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITATION_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const INVITATION_CODE_LENGTH = 5;

export function generateInvitationCode(): string {
  let code = "";
  for (let index = 0; index < INVITATION_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(
      Math.random() * INVITATION_CODE_CHARACTERS.length,
    );
    code += INVITATION_CODE_CHARACTERS[randomIndex];
  }
  return code;
}

export function isValidParentName(value: string): boolean {
  return NAME_PATTERN.test(value);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

export function validateLinkParentForm(
  values: LinkParentFormValues,
): LinkParentFormErrors {
  const errors: LinkParentFormErrors = {};
  const fullName = values.fullName.trim();
  const email = values.email.trim();

  if (!fullName) {
    errors.fullName = linkParentFormErrorMessages.fullNameRequired;
  } else if (!isValidParentName(fullName)) {
    errors.fullName = linkParentFormErrorMessages.fullNameInvalid;
  }

  if (!email) {
    errors.email = linkParentFormErrorMessages.emailRequired;
  } else if (!isValidEmail(email)) {
    errors.email = linkParentFormErrorMessages.emailInvalid;
  }

  if (!values.relationship) {
    errors.relationship = linkParentFormErrorMessages.relationshipRequired;
  }

  return errors;
}

export function hasLinkParentFormErrors(errors: LinkParentFormErrors): boolean {
  return Boolean(errors.fullName || errors.email || errors.relationship);
}
