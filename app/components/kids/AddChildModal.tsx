"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  addChildFormLabels,
  addChildFormPlaceholders,
  birthDateFormatHint,
  hasAddChildFormErrors,
  initialAddChildFormValues,
  roomOptions,
  validateAddChildForm,
  type AddChildFormErrors,
  type AddChildFormValues,
} from "./add-child-form";

type AddChildModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AddChildModal({ open, onClose }: AddChildModalProps) {
  const [values, setValues] = useState<AddChildFormValues>(
    initialAddChildFormValues,
  );
  const [errors, setErrors] = useState<AddChildFormErrors>({});
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const titleId = "add-child-modal-title";

  const resetForm = () => {
    setValues(initialAddChildFormValues);
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

    fullNameInputRef.current?.focus();

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

  const updateField = (field: keyof AddChildFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field === "fullName" || field === "birthDate" || field === "room") {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateAddChildForm(values);
    setErrors(nextErrors);

    if (!hasAddChildFormErrors(nextErrors)) {
      handleClose();
    }
  };

  const inputBaseClassName =
    "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-3.25 text-[15px] text-[#3F362E] outline-none transition-colors placeholder:text-[#B6A99B] focus:border-[#F2A78E]";
  const inputNormalBorderClassName = "border-[#EADFD0]";
  const inputErrorBorderClassName = "border-[#D9684A] focus:border-[#D9684A]";
  const labelClassName =
    "mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]";

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
        className="my-auto flex max-h-[calc(100vh-3rem)] w-full max-w-[520px] flex-col overflow-hidden rounded-3xl border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] sm:max-h-[calc(100vh-5rem)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#ECE0D0] px-5 py-5 sm:px-[26px]">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg text-[15px] font-bold text-[#94887B] transition-colors hover:text-[#7E7266]"
          >
            {addChildFormLabels.cancel}
          </button>
          <h2
            id={titleId}
            className="m-0 font-(family-name:--font-fredoka) text-[18px] font-semibold text-[#3F362E]"
          >
            {addChildFormLabels.title}
          </h2>
          <button
            type="submit"
            form="add-child-form"
            className="rounded-lg text-[15px] font-extrabold text-[#D9583C] transition-colors hover:text-[#C84C31]"
          >
            {addChildFormLabels.save}
          </button>
        </div>

        <form
          id="add-child-form"
          noValidate
          onSubmit={handleSubmit}
          className="overflow-y-auto px-5 py-6 sm:px-[26px]"
        >
          <div className="mb-4.5">
            <label htmlFor="add-child-full-name" className={labelClassName}>
              {addChildFormLabels.fullName}
            </label>
            <input
              ref={fullNameInputRef}
              id="add-child-full-name"
              name="fullName"
              type="text"
              value={values.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder={addChildFormPlaceholders.fullName}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "add-child-full-name-error" : undefined}
              className={`${inputBaseClassName} ${errors.fullName ? inputErrorBorderClassName : inputNormalBorderClassName}`}
            />
            {errors.fullName ? (
              <p
                id="add-child-full-name-error"
                className="mt-2 text-[13px] font-semibold text-[#D9684A]"
              >
                {errors.fullName}
              </p>
            ) : null}
          </div>

          <div className="mb-4.5 flex flex-col gap-3.5 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label htmlFor="add-child-birth-date" className={labelClassName}>
                {addChildFormLabels.birthDate}
              </label>
              <input
                id="add-child-birth-date"
                name="birthDate"
                type="text"
                inputMode="numeric"
                value={values.birthDate}
                onChange={(event) => updateField("birthDate", event.target.value)}
                placeholder={addChildFormPlaceholders.birthDate}
                aria-invalid={Boolean(errors.birthDate)}
                aria-describedby={
                  errors.birthDate
                    ? "add-child-birth-date-hint add-child-birth-date-error"
                    : "add-child-birth-date-hint"
                }
                className={`${inputBaseClassName} ${errors.birthDate ? inputErrorBorderClassName : inputNormalBorderClassName}`}
              />
              <p
                id="add-child-birth-date-hint"
                className="mt-2 text-[12.5px] font-semibold text-[#94887B]"
              >
                {birthDateFormatHint}
              </p>
              {errors.birthDate ? (
                <p
                  id="add-child-birth-date-error"
                  className="mt-1 text-[13px] font-semibold text-[#D9684A]"
                >
                  {errors.birthDate}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <label htmlFor="add-child-room" className={labelClassName}>
                {addChildFormLabels.room}
              </label>
              <select
                id="add-child-room"
                name="room"
                value={values.room}
                onChange={(event) => updateField("room", event.target.value)}
                aria-invalid={Boolean(errors.room)}
                aria-describedby={errors.room ? "add-child-room-error" : undefined}
                className={`${inputBaseClassName} ${errors.room ? inputErrorBorderClassName : inputNormalBorderClassName} ${values.room === "" ? "text-[#94887B]" : "text-[#3F362E]"}`}
              >
                <option value="">{addChildFormPlaceholders.room}</option>
                {roomOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.room ? (
                <p
                  id="add-child-room-error"
                  className="mt-2 text-[13px] font-semibold text-[#D9684A]"
                >
                  {errors.room}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mb-4.5">
            <label htmlFor="add-child-allergies" className={labelClassName}>
              {addChildFormLabels.allergies}
            </label>
            <input
              id="add-child-allergies"
              name="allergies"
              type="text"
              value={values.allergies}
              onChange={(event) => updateField("allergies", event.target.value)}
              placeholder={addChildFormPlaceholders.allergies}
              className={`${inputBaseClassName} ${inputNormalBorderClassName}`}
            />
          </div>

          <div>
            <label htmlFor="add-child-medical-notes" className={labelClassName}>
              {addChildFormLabels.medicalNotes}
            </label>
            <textarea
              id="add-child-medical-notes"
              name="medicalNotes"
              value={values.medicalNotes}
              onChange={(event) =>
                updateField("medicalNotes", event.target.value)
              }
              placeholder={addChildFormPlaceholders.medicalNotes}
              className={`${inputBaseClassName} ${inputNormalBorderClassName} min-h-[90px] resize-y leading-[1.5]`}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
