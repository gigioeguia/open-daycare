"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUserContext } from "@/utils/supabase/get-current-user-context";
import {
  POST_IMAGES_BUCKET,
  buildPostImageStoragePath,
} from "@/utils/supabase/post-images";

export type PostMutationResult =
  | { ok: true; postId: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        audience?: string;
        type?: string;
        description?: string;
        images?: string;
      };
    };

const ALLOWED_TYPES = new Set([
  "meal",
  "nap",
  "activity",
  "achievement",
  "mood",
  "photo",
  "announcement",
]);

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 1000;

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFiles(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function parseChildIds(formData: FormData): string[] {
  const raw = getString(formData, "childIds");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function validateDescription(body: string): string | undefined {
  const trimmed = body.trim();
  if (trimmed.length < MIN_DESCRIPTION) {
    return `La descripción debe tener al menos ${MIN_DESCRIPTION} caracteres.`;
  }
  if (trimmed.length > MAX_DESCRIPTION) {
    return `La descripción no puede superar ${MAX_DESCRIPTION} caracteres.`;
  }
  return undefined;
}

function validateImages(files: File[]): string | undefined {
  if (files.length > MAX_IMAGES) {
    return `Podés subir hasta ${MAX_IMAGES} imágenes.`;
  }
  let total = 0;
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return "Solo se permiten imágenes JPEG/JPG, PNG o WEBP.";
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return "Cada imagen debe pesar como máximo 2 MB.";
    }
    total += file.size;
  }
  if (total > MAX_TOTAL_BYTES) {
    return "El total de imágenes no puede superar 10 MB.";
  }
  return undefined;
}

async function requireStaffContext() {
  const context = await getCurrentUserContext();
  if (!context || (context.role !== "staff" && context.role !== "admin")) {
    return null;
  }
  return context;
}

async function cleanupUploadedPaths(paths: string[]) {
  if (paths.length === 0) return;
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.storage.from(POST_IMAGES_BUCKET).remove(paths);
  } catch {
    // Best-effort cleanup.
  }
}

export async function createPostAction(
  formData: FormData,
): Promise<PostMutationResult> {
  const context = await requireStaffContext();
  if (!context || !context.currentRoomId) {
    return { ok: false, message: "No tenés permisos para publicar en esta sala." };
  }

  const type = getString(formData, "type");
  const body = getString(formData, "description");
  const audienceMode = getString(formData, "audienceMode");
  const childIds = parseChildIds(formData);
  const files = getFiles(formData, "images");

  const fieldErrors: NonNullable<Extract<PostMutationResult, { ok: false }>["fieldErrors"]> = {};

  if (!ALLOWED_TYPES.has(type)) {
    fieldErrors.type = "Seleccioná un tipo válido.";
  }
  const descriptionError = validateDescription(body);
  if (descriptionError) {
    fieldErrors.description = descriptionError;
  }
  if (audienceMode !== "room" && audienceMode !== "children") {
    fieldErrors.audience = "Seleccioná al menos un destinatario.";
  } else if (audienceMode === "children" && childIds.length === 0) {
    fieldErrors.audience = "Seleccioná al menos un niño.";
  }
  const imagesError = validateImages(files);
  if (imagesError) {
    fieldErrors.images = imagesError;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los campos del formulario.", fieldErrors };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const postId = crypto.randomUUID();
  const uploadedPaths: string[] = [];

  try {
    // Validate children belong to daycare when audience is children.
    let validChildIds: string[] = [];
    if (audienceMode === "children") {
      const { data: childrenRows, error: childrenError } = await supabase
        .from("children")
        .select("id, room:rooms!inner(daycare_id)")
        .in("id", childIds);

      if (childrenError) {
        return { ok: false, message: "No se pudieron validar los destinatarios." };
      }

      validChildIds = (childrenRows ?? [])
        .flatMap((row) => {
          const room = Array.isArray(row.room) ? row.room[0] : row.room;
          if (!room || (room as { daycare_id: string }).daycare_id !== context.daycareId) {
            return [];
          }
          return [row.id as string];
        });

      if (validChildIds.length !== childIds.length) {
        return {
          ok: false,
          message: "Algunos destinatarios no son válidos.",
          fieldErrors: { audience: "Seleccioná destinatarios válidos." },
        };
      }
    }

    // Upload images first for rollback strategy.
    const photoRows: Array<{
      post_id: string;
      storage_path: string;
      mime_type: string;
      size_bytes: number;
      position: number;
    }> = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const storagePath = buildPostImageStoragePath({
        daycareId: context.daycareId,
        postId,
        fileName: file.name || `image-${index + 1}`,
      });
      const buffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from(POST_IMAGES_BUCKET)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        await cleanupUploadedPaths(uploadedPaths);
        console.error("createPostAction: image upload failed", {
          storagePath,
          contentType: file.type,
          size: file.size,
          error: uploadError,
        });
        return {
          ok: false,
          message: `No se pudieron subir las imágenes. ${uploadError.message ?? "Error de Storage."}`,
          fieldErrors: { images: "Intentá nuevamente." },
        };
      }

      uploadedPaths.push(storagePath);
      photoRows.push({
        post_id: postId,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        position: index,
      });
    }

    const { error: postError } = await supabase.from("posts").insert({
      id: postId,
      daycare_id: context.daycareId,
      author_id: context.userId,
      room_id: context.currentRoomId,
      type,
      body: body.trim(),
      published_at: new Date().toISOString(),
    });

    if (postError) {
      await cleanupUploadedPaths(uploadedPaths);
      console.error("createPostAction: post insert failed", { postId, error: postError });
      return { ok: false, message: `No se pudo crear la publicación. ${postError.message ?? ""}`.trim() };
    }

    if (audienceMode === "children" && validChildIds.length > 0) {
      const { error: childrenInsertError } = await supabase
        .from("post_children")
        .insert(validChildIds.map((childId) => ({ post_id: postId, child_id: childId })));

      if (childrenInsertError) {
        await supabase.from("posts").delete().eq("id", postId);
        await cleanupUploadedPaths(uploadedPaths);
        console.error("createPostAction: post_children insert failed", { postId, error: childrenInsertError });
        return { ok: false, message: `No se pudo guardar los destinatarios. ${childrenInsertError.message ?? ""}`.trim() };
      }
    }

    if (photoRows.length > 0) {
      const { error: photosError } = await supabase.from("post_photos").insert(photoRows);
      if (photosError) {
        await supabase.from("posts").delete().eq("id", postId);
        await cleanupUploadedPaths(uploadedPaths);
        console.error("createPostAction: post_photos insert failed", { postId, error: photosError });
        return { ok: false, message: `No se pudieron guardar las imágenes. ${photosError.message ?? ""}`.trim() };
      }
    }

    revalidatePath("/");
    revalidatePath("/staff");
    revalidatePath("/family");
    return { ok: true, postId };
  } catch {
    await cleanupUploadedPaths(uploadedPaths);
    return { ok: false, message: "Ocurrió un error al publicar. Intentá nuevamente." };
  }
}

function parseStringArray(formData: FormData, key: string): string[] {
  const raw = getString(formData, key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export async function updatePostAction(
  formData: FormData,
): Promise<PostMutationResult> {
  const context = await requireStaffContext();
  if (!context || !context.currentRoomId) {
    return { ok: false, message: "No tenés permisos para editar publicaciones." };
  }

  const postId = getString(formData, "postId");
  const type = getString(formData, "type");
  const body = getString(formData, "description");
  const audienceMode = getString(formData, "audienceMode");
  const childIds = parseChildIds(formData);
  const keepPhotoIds = parseStringArray(formData, "keepPhotoIds");
  const files = getFiles(formData, "images");

  if (!postId) {
    return { ok: false, message: "Publicación no encontrada." };
  }

  const fieldErrors: NonNullable<Extract<PostMutationResult, { ok: false }>["fieldErrors"]> = {};
  if (!ALLOWED_TYPES.has(type)) {
    fieldErrors.type = "Seleccioná un tipo válido.";
  }
  const descriptionError = validateDescription(body);
  if (descriptionError) {
    fieldErrors.description = descriptionError;
  }
  if (audienceMode !== "room" && audienceMode !== "children") {
    fieldErrors.audience = "Seleccioná al menos un destinatario.";
  } else if (audienceMode === "children" && childIds.length === 0) {
    fieldErrors.audience = "Seleccioná al menos un niño.";
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: existingPost, error: existingPostError } = await supabase
    .from("posts")
    .select("id, daycare_id, room_id")
    .eq("id", postId)
    .eq("daycare_id", context.daycareId)
    .maybeSingle();

  if (existingPostError || !existingPost) {
    return { ok: false, message: "No se encontró la publicación." };
  }

  const { data: existingPhotos, error: existingPhotosError } = await supabase
    .from("post_photos")
    .select("id, storage_path, position")
    .eq("post_id", postId);

  if (existingPhotosError) {
    return { ok: false, message: "No se pudieron cargar las imágenes actuales." };
  }

  const existingPhotoRows = (existingPhotos ?? []) as Array<{
    id: string;
    storage_path: string;
    position: number;
  }>;
  const keepSet = new Set(keepPhotoIds);
  const photosToKeep = existingPhotoRows.filter((photo) => keepSet.has(photo.id));
  const photosToRemove = existingPhotoRows.filter((photo) => !keepSet.has(photo.id));

  const imagesError = validateImages(files);
  if (imagesError) {
    fieldErrors.images = imagesError;
  }
  if (photosToKeep.length + files.length > MAX_IMAGES) {
    fieldErrors.images = `Podés tener hasta ${MAX_IMAGES} imágenes en total.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Revisá los campos del formulario.", fieldErrors };
  }

  let validChildIds: string[] = [];
  if (audienceMode === "children") {
    const { data: childrenRows, error: childrenError } = await supabase
      .from("children")
      .select("id, room:rooms!inner(daycare_id)")
      .in("id", childIds);

    if (childrenError) {
      return { ok: false, message: "No se pudieron validar los destinatarios." };
    }

    validChildIds = (childrenRows ?? []).flatMap((row) => {
      const room = Array.isArray(row.room) ? row.room[0] : row.room;
      if (!room || (room as { daycare_id: string }).daycare_id !== context.daycareId) {
        return [];
      }
      return [row.id as string];
    });

    if (validChildIds.length !== childIds.length) {
      return {
        ok: false,
        message: "Algunos destinatarios no son válidos.",
        fieldErrors: { audience: "Seleccioná destinatarios válidos." },
      };
    }
  }

  const uploadedPaths: string[] = [];
  try {
    const newPhotoRows: Array<{
      post_id: string;
      storage_path: string;
      mime_type: string;
      size_bytes: number;
      position: number;
    }> = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const storagePath = buildPostImageStoragePath({
        daycareId: context.daycareId,
        postId,
        fileName: file.name || `image-${index + 1}`,
      });
      const buffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from(POST_IMAGES_BUCKET)
        .upload(storagePath, buffer, { contentType: file.type, upsert: false });

      if (uploadError) {
        await cleanupUploadedPaths(uploadedPaths);
        console.error("updatePostAction: image upload failed", {
          storagePath,
          contentType: file.type,
          size: file.size,
          error: uploadError,
        });
        return {
          ok: false,
          message: `No se pudieron subir las imágenes nuevas. ${uploadError.message ?? "Error de Storage."}`,
          fieldErrors: { images: "Intentá nuevamente." },
        };
      }

      uploadedPaths.push(storagePath);
      newPhotoRows.push({
        post_id: postId,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        position: photosToKeep.length + index,
      });
    }

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        type,
        body: body.trim(),
        room_id: context.currentRoomId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("daycare_id", context.daycareId);

    if (updateError) {
      await cleanupUploadedPaths(uploadedPaths);
      return { ok: false, message: "No se pudo actualizar la publicación." };
    }

    const { error: deleteChildrenError } = await supabase
      .from("post_children")
      .delete()
      .eq("post_id", postId);
    if (deleteChildrenError) {
      await cleanupUploadedPaths(uploadedPaths);
      return { ok: false, message: "No se pudieron actualizar los destinatarios." };
    }

    if (audienceMode === "children" && validChildIds.length > 0) {
      const { error: insertChildrenError } = await supabase
        .from("post_children")
        .insert(validChildIds.map((childId) => ({ post_id: postId, child_id: childId })));
      if (insertChildrenError) {
        await cleanupUploadedPaths(uploadedPaths);
        return { ok: false, message: "No se pudieron guardar los destinatarios." };
      }
    }

    if (newPhotoRows.length > 0) {
      const { error: insertPhotosError } = await supabase
        .from("post_photos")
        .insert(newPhotoRows);
      if (insertPhotosError) {
        await cleanupUploadedPaths(uploadedPaths);
        return { ok: false, message: "No se pudieron guardar las imágenes nuevas." };
      }
    }

    if (photosToRemove.length > 0) {
      const removeIds = photosToRemove.map((photo) => photo.id);
      const { error: removePhotosError } = await supabase
        .from("post_photos")
        .delete()
        .in("id", removeIds);
      if (removePhotosError) {
        // Best-effort rollback: remove newly uploaded files/rows to avoid partial mixed state.
        await cleanupUploadedPaths(uploadedPaths);
        if (newPhotoRows.length > 0) {
          await supabase
            .from("post_photos")
            .delete()
            .eq("post_id", postId)
            .in("storage_path", uploadedPaths);
        }
        return { ok: false, message: "No se pudieron actualizar las imágenes." };
      }

      const removePaths = photosToRemove.map((photo) => photo.storage_path);
      await supabase.storage.from(POST_IMAGES_BUCKET).remove(removePaths);
    }

    revalidatePath("/");
    revalidatePath("/staff");
    revalidatePath("/family");
    return { ok: true, postId };
  } catch {
    await cleanupUploadedPaths(uploadedPaths);
    return { ok: false, message: "Ocurrió un error al actualizar la publicación." };
  }
}

export async function deletePostAction(postId: string): Promise<PostMutationResult> {
  const context = await requireStaffContext();
  if (!context) {
    return { ok: false, message: "No tenés permisos para eliminar publicaciones." };
  }

  if (!postId) {
    return { ok: false, message: "Publicación no encontrada." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: photos, error: photosError } = await supabase
    .from("post_photos")
    .select("storage_path")
    .eq("post_id", postId);

  if (photosError) {
    return { ok: false, message: "No se pudo eliminar la publicación." };
  }

  const paths = (photos ?? [])
    .map((row) => (row as { storage_path: string }).storage_path)
    .filter(Boolean);

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("daycare_id", context.daycareId);

  if (deleteError) {
    return { ok: false, message: "No se pudo eliminar la publicación." };
  }

  if (paths.length > 0) {
    await supabase.storage.from(POST_IMAGES_BUCKET).remove(paths);
  }

  revalidatePath("/");
  revalidatePath("/staff");
  revalidatePath("/family");
  return { ok: true, postId };
}
