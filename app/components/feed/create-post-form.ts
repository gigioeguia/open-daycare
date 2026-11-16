import type { AudienceChildOption, FeedPostTypeId } from "./feed-types";

export type PostAudienceMode = "children" | "room";

export type PostTypeOption = {
  id: FeedPostTypeId;
  label: string;
  backgroundColor: string;
  color: string;
};

export type CreatePostFormValues = {
  audienceMode: PostAudienceMode;
  childIds: string[];
  typeId: FeedPostTypeId | "";
  description: string;
};

export type CreatePostFormErrors = {
  audience?: string;
  type?: string;
  description?: string;
  images?: string;
  general?: string;
};

export type EditableImage = {
  id: string;
  storagePath: string;
  signedUrl: string | null;
};

export const postTypeOptions: PostTypeOption[] = [
  { id: "meal", label: "Comida", backgroundColor: "#9A7B1E", color: "#FFFFFF" },
  { id: "nap", label: "Siesta", backgroundColor: "#E7DCF6", color: "#7B5FC0" },
  { id: "activity", label: "Actividad", backgroundColor: "#2E89A6", color: "#FFFFFF" },
  { id: "achievement", label: "Logro", backgroundColor: "#CFEBD8", color: "#3E9B6C" },
  { id: "mood", label: "Ánimo", backgroundColor: "#F9D2DE", color: "#C56486" },
  { id: "photo", label: "Foto", backgroundColor: "#FBD8CC", color: "#D9684A" },
  { id: "announcement", label: "Anuncio", backgroundColor: "#CCD8F4", color: "#4E72C8" },
];

export const initialCreatePostFormValues: CreatePostFormValues = {
  audienceMode: "children",
  childIds: [],
  typeId: "",
  description: "",
};

export const createPostFormLabels = {
  cancel: "Cancelar",
  titleCreate: "Nueva publicación",
  titleEdit: "Editar publicación",
  publish: "Publicar",
  save: "Guardar cambios",
  audience: "PARA",
  type: "TIPO",
  description: "DESCRIPCIÓN",
  photos: "FOTOS",
  addPhoto: "Agregar",
  everyone: "Toda la sala",
};

export const createPostFormPlaceholders = {
  description: "Contá cómo le fue hoy…",
};

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_TOTAL_IMAGE_BYTES = 10 * 1024 * 1024;
export const MIN_DESCRIPTION_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 1000;

export function toggleAudienceSelection(
  values: CreatePostFormValues,
  option: "room" | { childId: string },
): CreatePostFormValues {
  if (option === "room") {
    const isRoomSelected = values.audienceMode === "room";
    return {
      ...values,
      audienceMode: isRoomSelected ? "children" : "room",
      childIds: isRoomSelected ? values.childIds : [],
    };
  }

  const currentChildIds = values.audienceMode === "room" ? [] : values.childIds;
  const exists = currentChildIds.includes(option.childId);
  const nextChildIds = exists
    ? currentChildIds.filter((id) => id !== option.childId)
    : [...currentChildIds, option.childId];

  return {
    ...values,
    audienceMode: "children",
    childIds: nextChildIds,
  };
}

export function validateCreatePostForm(
  values: CreatePostFormValues,
): CreatePostFormErrors {
  const errors: CreatePostFormErrors = {};
  const trimmedDescription = values.description.trim();

  if (values.audienceMode === "children" && values.childIds.length === 0) {
    errors.audience = "Seleccioná al menos un destinatario.";
  }

  if (values.typeId === "") {
    errors.type = "Seleccioná un tipo.";
  }

  if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
    errors.description = `La descripción debe tener al menos ${MIN_DESCRIPTION_LENGTH} caracteres.`;
  } else if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`;
  }

  return errors;
}

export function validateImagesSelection(params: {
  existingCount: number;
  newFiles: File[];
}): string | undefined {
  const { existingCount, newFiles } = params;
  const totalCount = existingCount + newFiles.length;
  if (totalCount > MAX_IMAGES) {
    return `Podés subir hasta ${MAX_IMAGES} imágenes en total.`;
  }

  let totalBytes = 0;
  for (const file of newFiles) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Solo se permiten imágenes JPEG/JPG, PNG o WEBP.";
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return "Cada imagen debe pesar como máximo 2 MB.";
    }
    totalBytes += file.size;
  }

  if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
    return "El total de imágenes nuevas no puede superar 10 MB.";
  }

  return undefined;
}

export function hasCreatePostFormErrors(errors: CreatePostFormErrors): boolean {
  return Object.values(errors).some((error) => Boolean(error));
}

export function getSelectedChildIds(values: CreatePostFormValues): string[] {
  return values.audienceMode === "room" ? [] : values.childIds;
}

export function isRoomAudience(values: CreatePostFormValues): boolean {
  return values.audienceMode === "room";
}

export function getAudienceInitial(option: AudienceChildOption): string {
  return option.initial || (option.label.trim().charAt(0) || "?").toUpperCase();
}
