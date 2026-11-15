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
  label: string;
  initial?: string;
  avatarBackgroundColor?: string;
  avatarColor?: string;
  isGlobal?: boolean;
};

export type PostTypeOption = {
  id: PostTypeId;
  label: string;
  backgroundColor: string;
  color: string;
};

export type CreatePostFormValues = {
  audienceIds: PostAudienceId[];
  typeId: PostTypeId | "";
  description: string;
};

export type CreatePostFormErrors = {
  audience?: string;
  type?: string;
  description?: string;
};

export const audienceOptions: AudienceOption[] = [
  {
    id: "mateo",
    label: "Mateo",
    initial: "M",
    avatarBackgroundColor: "#A9D9E8",
    avatarColor: "#1F7A93",
  },
  {
    id: "sofia",
    label: "Sofía",
    initial: "S",
    avatarBackgroundColor: "#F4B8CC",
    avatarColor: "#C44A7A",
  },
  {
    id: "benjamin",
    label: "Benjamín",
    initial: "B",
    avatarBackgroundColor: "#B9DEC4",
    avatarColor: "#3E8B62",
  },
  {
    id: "everyone",
    label: "Toda la sala",
    isGlobal: true,
  },
];

export const postTypeOptions: PostTypeOption[] = [
  { id: "meal", label: "Comida", backgroundColor: "#9A7B1E", color: "#FFFFFF" },
  { id: "nap", label: "Siesta", backgroundColor: "#E7DCF6", color: "#7B5FC0" },
  {
    id: "activity",
    label: "Actividad",
    backgroundColor: "#2E89A6",
    color: "#FFFFFF",
  },
  {
    id: "achievement",
    label: "Logro",
    backgroundColor: "#CFEBD8",
    color: "#3E9B6C",
  },
  { id: "mood", label: "Ánimo", backgroundColor: "#F9D2DE", color: "#C56486" },
  { id: "photo", label: "Foto", backgroundColor: "#FBD8CC", color: "#D9684A" },
  {
    id: "announcement",
    label: "Anuncio",
    backgroundColor: "#CCD8F4",
    color: "#4E72C8",
  },
];

export const initialCreatePostFormValues: CreatePostFormValues = {
  audienceIds: [],
  typeId: "",
  description: "",
};

export const createPostFormLabels = {
  cancel: "Cancelar",
  title: "Nueva publicación",
  publish: "Publicar",
  audience: "PARA",
  type: "TIPO",
  description: "DESCRIPCIÓN",
  photos: "FOTOS",
  addPhoto: "Agregar",
};

export const createPostFormPlaceholders = {
  description: "Contá cómo le fue hoy…",
};

export const createPostFormErrors = {
  audienceRequired: "Seleccioná al menos un destinatario.",
  typeRequired: "Seleccioná un tipo.",
  descriptionRequired: "La descripción es obligatoria.",
  descriptionInvalid: "Usá solo letras y signos de puntuación (sin números).",
};

const digitsPattern = /\p{N}/u;
const invalidDescriptionPattern = /[^\p{L}\s.,;:¡!¿?'"()\-]/u;

export function toggleAudienceSelection(
  selectedAudienceIds: PostAudienceId[],
  audienceId: PostAudienceId,
): PostAudienceId[] {
  if (audienceId === "everyone") {
    return selectedAudienceIds.includes("everyone") ? [] : ["everyone"];
  }

  const withoutGlobal = selectedAudienceIds.filter((id) => id !== "everyone");

  if (withoutGlobal.includes(audienceId)) {
    return withoutGlobal.filter((id) => id !== audienceId);
  }

  return [...withoutGlobal, audienceId];
}

export function validateCreatePostForm(
  values: CreatePostFormValues,
): CreatePostFormErrors {
  const errors: CreatePostFormErrors = {};
  const trimmedDescription = values.description.trim();

  if (values.audienceIds.length === 0) {
    errors.audience = createPostFormErrors.audienceRequired;
  }

  if (values.typeId === "") {
    errors.type = createPostFormErrors.typeRequired;
  }

  if (trimmedDescription.length === 0) {
    errors.description = createPostFormErrors.descriptionRequired;
  } else if (
    digitsPattern.test(values.description) ||
    invalidDescriptionPattern.test(values.description)
  ) {
    errors.description = createPostFormErrors.descriptionInvalid;
  }

  return errors;
}

export function hasCreatePostFormErrors(
  errors: CreatePostFormErrors,
): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}
