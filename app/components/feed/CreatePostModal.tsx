"use client";

import { useEffect, type FormEvent } from "react";
import { useState } from "react";
import { CloseIcon } from "./icons/CloseIcon";
import { ImageIcon } from "./icons/ImageIcon";
import { PlusIcon } from "./icons/PlusIcon";
import {
  audienceOptions,
  createPostFormLabels,
  createPostFormPlaceholders,
  hasCreatePostFormErrors,
  initialCreatePostFormValues,
  postTypeOptions,
  toggleAudienceSelection,
  validateCreatePostForm,
  type CreatePostFormErrors,
  type CreatePostFormValues,
  type PostAudienceId,
  type PostTypeId,
} from "./create-post-form";

type CreatePostModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreatePostModal({ open, onClose }: CreatePostModalProps) {
  const [values, setValues] = useState<CreatePostFormValues>(
    initialCreatePostFormValues,
  );
  const [errors, setErrors] = useState<CreatePostFormErrors>({});
  const titleId = "create-post-modal-title";

  const resetForm = () => {
    setValues(initialCreatePostFormValues);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        resetForm();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleAudienceToggle = (audienceId: PostAudienceId) => {
    setValues((current) => ({
      ...current,
      audienceIds: toggleAudienceSelection(current.audienceIds, audienceId),
    }));
    setErrors((current) => ({ ...current, audience: undefined }));
  };

  const handleTypeSelect = (typeId: PostTypeId) => {
    setValues((current) => ({ ...current, typeId }));
    setErrors((current) => ({ ...current, type: undefined }));
  };

  const handleDescriptionChange = (description: string) => {
    setValues((current) => ({ ...current, description }));
    setErrors((current) => ({ ...current, description: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateCreatePostForm(values);
    setErrors(nextErrors);

    if (!hasCreatePostFormErrors(nextErrors)) {
      handleClose();
    }
  };

  const sectionLabelClassName =
    "mb-2.5 block text-xs font-extrabold tracking-[0.7px] text-[#94887B]";
  const errorTextClassName = "mt-2 text-[13px] font-semibold text-[#D9684A]";

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
              className="rounded-lg text-[15px] font-bold text-[#94887B] transition-colors hover:text-[#7E7266]"
            >
              {createPostFormLabels.cancel}
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94887B] transition-colors hover:bg-[#F3E8DB] hover:text-[#6E6359]"
            >
              <CloseIcon />
            </button>
          </div>
          <h2
            id={titleId}
            className="text-center font-(family-name:--font-fredoka) text-lg font-semibold text-[#3F362E]"
          >
            {createPostFormLabels.title}
          </h2>
          <button
            type="submit"
            form="create-post-form"
            className="justify-self-end rounded-lg text-[15px] font-extrabold text-[#D9583C] transition-colors hover:text-[#C84C31]"
          >
            {createPostFormLabels.publish}
          </button>
        </div>

        <form
          id="create-post-form"
          noValidate
          onSubmit={handleSubmit}
          className="overflow-y-auto px-5 py-6 sm:px-[26px]"
        >
          <div className="mb-[22px]">
            <span className={sectionLabelClassName}>
              {createPostFormLabels.audience}
            </span>
            <div className="flex flex-wrap gap-2.25" role="group" aria-label="Destinatarios">
              {audienceOptions.map((option) => {
                const isSelected = values.audienceIds.includes(option.id);
                const baseClassName =
                  "flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] text-sm font-bold transition-colors";
                const selectedClassName = "border-[#3F362E] bg-[#3F362E] text-white";
                const unselectedClassName =
                  "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]";

                if (option.isGlobal) {
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleAudienceToggle(option.id)}
                      className={`${baseClassName} px-4 py-1.5 ${isSelected ? selectedClassName : unselectedClassName}`}
                    >
                      {option.label}
                    </button>
                  );
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleAudienceToggle(option.id)}
                    className={`${baseClassName} py-1.5 pl-1.5 pr-3.5 ${isSelected ? selectedClassName : unselectedClassName}`}
                  >
                    <span
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-(family-name:--font-fredoka) text-[13px] font-semibold"
                      style={{
                        backgroundColor: option.avatarBackgroundColor,
                        color: option.avatarColor,
                      }}
                      aria-hidden="true"
                    >
                      {option.initial}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
            {errors.audience ? (
              <p className={errorTextClassName}>{errors.audience}</p>
            ) : null}
          </div>

          <div className="mb-[22px]">
            <span className={sectionLabelClassName}>
              {createPostFormLabels.type}
            </span>
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
                    style={{
                      backgroundColor: option.backgroundColor,
                      color: option.color,
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {errors.type ? <p className={errorTextClassName}>{errors.type}</p> : null}
          </div>

          <div className="mb-[22px]">
            <label
              htmlFor="create-post-description"
              className={sectionLabelClassName}
            >
              {createPostFormLabels.description}
            </label>
            <textarea
              id="create-post-description"
              name="description"
              value={values.description}
              onChange={(event) => handleDescriptionChange(event.target.value)}
              placeholder={createPostFormPlaceholders.description}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "create-post-description-error" : undefined
              }
              className={`min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] bg-white px-4 py-3.5 text-[15px] leading-normal text-[#3F362E] outline-none transition-colors placeholder:text-[#B6A99B] focus:border-[#F2A78E] ${
                errors.description
                  ? "border-[#D9684A] focus:border-[#D9684A]"
                  : "border-[#EADFD0]"
              }`}
            />
            {errors.description ? (
              <p
                id="create-post-description-error"
                className={errorTextClassName}
              >
                {errors.description}
              </p>
            ) : null}
          </div>

          <div>
            <span className={sectionLabelClassName}>
              {createPostFormLabels.photos}
            </span>
            <div className="flex gap-3">
              <div className="flex h-24 w-24 items-center justify-center rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1] text-[#CBB89F]">
                <ImageIcon size={26} />
              </div>
              <div
                aria-disabled="true"
                className="flex h-24 w-24 cursor-default flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
              >
                <span className="text-[#C5503A]">
                  <PlusIcon />
                </span>
                <span className="text-xs">{createPostFormLabels.addPhoto}</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
