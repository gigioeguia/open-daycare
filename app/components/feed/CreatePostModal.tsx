"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createPostAction, updatePostAction, type PostMutationResult } from "@/app/feed/actions";
import type { AudienceChildOption, FeedPost } from "./feed-types";
import { CloseIcon } from "./icons/CloseIcon";
import { ImageIcon } from "./icons/ImageIcon";
import { PlusIcon } from "./icons/PlusIcon";
import {
  ALLOWED_IMAGE_TYPES,
  createPostFormLabels,
  createPostFormPlaceholders,
  getAudienceInitial,
  hasCreatePostFormErrors,
  initialCreatePostFormValues,
  isRoomAudience,
  postTypeOptions,
  toggleAudienceSelection,
  validateCreatePostForm,
  validateImagesSelection,
  type CreatePostFormErrors,
  type CreatePostFormValues,
  type EditableImage,
} from "./create-post-form";

type CreatePostModalProps = {
  open: boolean;
  onClose: () => void;
  childrenOptions: AudienceChildOption[];
  currentRoomName?: string | null;
  mode?: "create" | "edit";
  post?: FeedPost | null;
};

type NewImagePreview = {
  id: string;
  file: File;
  previewUrl: string;
};

function getInitialValuesFromPost(post?: FeedPost | null): {
  values: CreatePostFormValues;
  existingImages: EditableImage[];
} {
  if (!post) {
    return { values: initialCreatePostFormValues, existingImages: [] };
  }

  return {
    values: {
      audienceMode: post.audienceMode,
      childIds: post.childIds,
      typeId: post.type,
      description: post.body,
    },
    existingImages: post.images.map((image) => ({
      id: image.id,
      storagePath: image.storagePath,
      signedUrl: image.signedUrl,
    })),
  };
}

export function CreatePostModal({
  open,
  onClose,
  childrenOptions,
  currentRoomName,
  mode = "create",
  post = null,
}: CreatePostModalProps) {
  const initialFromPost = useMemo(
    () => getInitialValuesFromPost(mode === "edit" ? post : null),
    [mode, post],
  );
  const [values, setValues] = useState<CreatePostFormValues>(initialFromPost.values);
  const [errors, setErrors] = useState<CreatePostFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<EditableImage[]>(
    initialFromPost.existingImages,
  );
  const [newImages, setNewImages] = useState<NewImagePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const newImagesRef = useRef<NewImagePreview[]>([]);
  const titleId = "create-post-modal-title";
  const isEditMode = mode === "edit" && Boolean(post);

  useEffect(() => {
    newImagesRef.current = newImages;
  }, [newImages]);

  useEffect(() => {
    return () => {
      newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        event.preventDefault();
        newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    newImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    onClose();
  };

  const handleTypeSelect = (typeId: CreatePostFormValues["typeId"]) => {
    if (typeId === "") return;
    setValues((current) => ({ ...current, typeId }));
    setErrors((current) => ({ ...current, type: undefined, general: undefined }));
  };

  const handleDescriptionChange = (description: string) => {
    setValues((current) => ({ ...current, description }));
    setErrors((current) => ({ ...current, description: undefined, general: undefined }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const imageError = validateImagesSelection({
      existingCount: existingImages.length,
      newFiles: [...newImages.map((item) => item.file), ...files],
    });
    if (imageError) {
      setErrors((current) => ({ ...current, images: imageError }));
      event.target.value = "";
      return;
    }

    const previews = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setNewImages((current) => [...current, ...previews]);
    setErrors((current) => ({ ...current, images: undefined, general: undefined }));
    event.target.value = "";
  };

  const removeExistingImage = (id: string) => {
    setExistingImages((current) => current.filter((image) => image.id !== id));
    setErrors((current) => ({ ...current, images: undefined, general: undefined }));
  };

  const removeNewImage = (id: string) => {
    setNewImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== id);
    });
    setErrors((current) => ({ ...current, images: undefined, general: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateCreatePostForm(values);
    const imageError = validateImagesSelection({
      existingCount: existingImages.length,
      newFiles: newImages.map((image) => image.file),
    });
    if (imageError) {
      nextErrors.images = imageError;
    }

    setErrors(nextErrors);
    if (hasCreatePostFormErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData();
    formData.set("type", values.typeId);
    formData.set("description", values.description);
    formData.set("audienceMode", values.audienceMode);
    formData.set("childIds", JSON.stringify(values.audienceMode === "room" ? [] : values.childIds));
    for (const image of newImages) {
      formData.append("images", image.file);
    }

    let result: PostMutationResult;
    if (isEditMode && post) {
      formData.set("postId", post.id);
      formData.set("keepPhotoIds", JSON.stringify(existingImages.map((image) => image.id)));
      result = await updatePostAction(formData);
    } else {
      result = await createPostAction(formData);
    }

    if (!result.ok) {
      setErrors({
        ...result.fieldErrors,
        general: result.message,
      });
      setIsSubmitting(false);
      return;
    }

    newImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setIsSubmitting(false);
    onClose();
  };

  const sectionLabelClassName =
    "mb-2.5 block text-xs font-extrabold tracking-[0.7px] text-[#94887B]";
  const errorTextClassName = "mt-2 text-[13px] font-semibold text-[#D9684A]";
  const roomSelected = isRoomAudience(values);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(63,54,46,0.35)] px-4 py-6 sm:px-6 sm:py-10"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="my-auto flex max-h-[calc(100vh-3rem)] w-full max-w-[580px] flex-col overflow-hidden rounded-3xl border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] sm:max-h-[calc(100vh-5rem)]"
      >
        <div className="grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-[#ECE0D0] px-5 py-5 sm:px-[26px]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg text-[15px] font-bold text-[#94887B] transition-colors hover:text-[#7E7266] disabled:opacity-50"
            >
              {createPostFormLabels.cancel}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94887B] transition-colors hover:bg-[#F3E8DB] hover:text-[#6E6359] disabled:opacity-50"
            >
              <CloseIcon />
            </button>
          </div>
          <h2
            id={titleId}
            className="text-center font-(family-name:--font-fredoka) text-lg font-semibold text-[#3F362E]"
          >
            {isEditMode ? createPostFormLabels.titleEdit : createPostFormLabels.titleCreate}
          </h2>
          <button
            type="submit"
            form="create-post-form"
            disabled={isSubmitting}
            className="justify-self-end rounded-lg text-[15px] font-extrabold text-[#D9583C] transition-colors hover:text-[#C84C31] disabled:opacity-50"
          >
            {isSubmitting
              ? "Guardando..."
              : isEditMode
                ? createPostFormLabels.save
                : createPostFormLabels.publish}
          </button>
        </div>

        <form
          id="create-post-form"
          noValidate
          onSubmit={handleSubmit}
          className="overflow-y-auto px-5 py-6 sm:px-[26px]"
        >
          {errors.general ? <p className={`${errorTextClassName} mb-4`}>{errors.general}</p> : null}

          <div className="mb-[22px]">
            <span className={sectionLabelClassName}>{createPostFormLabels.audience}</span>
            <div className="flex flex-wrap gap-2.25" role="group" aria-label="Destinatarios">
              {childrenOptions.map((option) => {
                const selected = !roomSelected && values.childIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setValues((current) => toggleAudienceSelection(current, { childId: option.id }));
                      setErrors((current) => ({ ...current, audience: undefined, general: undefined }));
                    }}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-1.5 pl-1.5 pr-3.5 text-sm font-bold transition-colors ${selected ? "border-[#3F362E] bg-[#3F362E] text-white" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`}
                  >
                    <span
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-(family-name:--font-fredoka) text-[13px] font-semibold"
                      style={{ backgroundColor: option.avatarBackgroundColor, color: option.avatarColor }}
                      aria-hidden="true"
                    >
                      {getAudienceInitial(option)}
                    </span>
                    {option.label}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={roomSelected}
                onClick={() => {
                  setValues((current) => toggleAudienceSelection(current, "room"));
                  setErrors((current) => ({ ...current, audience: undefined, general: undefined }));
                }}
                className={`flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-4 py-1.5 text-sm font-bold transition-colors ${roomSelected ? "border-[#3F362E] bg-[#3F362E] text-white" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`}
              >
                {createPostFormLabels.everyone}
                {currentRoomName ? ` · ${currentRoomName}` : ""}
              </button>
            </div>
            {errors.audience ? <p className={errorTextClassName}>{errors.audience}</p> : null}
          </div>

          <div className="mb-[22px]">
            <span className={sectionLabelClassName}>{createPostFormLabels.type}</span>
            <div className="flex flex-wrap gap-2.25" role="group" aria-label="Tipo de publicación">
              {postTypeOptions.map((option) => {
                const isSelected = values.typeId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleTypeSelect(option.id)}
                    className={`cursor-pointer rounded-full border-none px-4 py-2 text-[13.5px] font-extrabold transition-opacity ${isSelected ? "opacity-100 ring-2 ring-[#3F362E] ring-offset-2 ring-offset-[#FBF4EC]" : "opacity-90 hover:opacity-100"}`}
                    style={{ backgroundColor: option.backgroundColor, color: option.color }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {errors.type ? <p className={errorTextClassName}>{errors.type}</p> : null}
          </div>

          <div className="mb-[22px]">
            <label htmlFor="create-post-description" className={sectionLabelClassName}>
              {createPostFormLabels.description}
            </label>
            <textarea
              id="create-post-description"
              name="description"
              value={values.description}
              onChange={(event) => handleDescriptionChange(event.target.value)}
              placeholder={createPostFormPlaceholders.description}
              aria-invalid={Boolean(errors.description)}
              className={`min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] bg-white px-4 py-3.5 text-[15px] leading-normal text-[#3F362E] outline-none transition-colors placeholder:text-[#B6A99B] focus:border-[#F2A78E] ${errors.description ? "border-[#D9684A] focus:border-[#D9684A]" : "border-[#EADFD0]"}`}
            />
            {errors.description ? <p className={errorTextClassName}>{errors.description}</p> : null}
          </div>

          <div>
            <span className={sectionLabelClassName}>{createPostFormLabels.photos}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap gap-3">
              {existingImages.map((image) => (
                <div
                  key={image.id}
                  className="relative h-24 w-24 overflow-hidden rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1]"
                >
                  {image.signedUrl ? (
                    <img
                      src={image.signedUrl}
                      alt="Imagen de publicación"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#CBB89F]">
                      <ImageIcon size={26} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeExistingImage(image.id)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(63,54,46,0.7)] text-white"
                    aria-label="Quitar imagen"
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
              {newImages.map((image) => (
                <div
                  key={image.id}
                  className="relative h-24 w-24 overflow-hidden rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1]"
                >
                  <img src={image.previewUrl} alt="Vista previa" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(image.id)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(63,54,46,0.7)] text-white"
                    aria-label="Quitar imagen"
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
              {existingImages.length + newImages.length < 5 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290] transition-colors hover:border-[#C5503A]"
                >
                  <span className="text-[#C5503A]">
                    <PlusIcon />
                  </span>
                  <span className="text-xs">{createPostFormLabels.addPhoto}</span>
                </button>
              ) : null}
            </div>
            {errors.images ? <p className={errorTextClassName}>{errors.images}</p> : null}
            <p className="mt-2 text-[12px] text-[#A89A8B]">
              Hasta 5 imágenes (JPEG/PNG/WEBP), 2 MB por imagen y 10 MB en total.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
