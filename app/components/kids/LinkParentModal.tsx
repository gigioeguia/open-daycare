"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import {
  generateInvitationCode,
  hasLinkParentFormErrors,
  initialLinkParentFormValues,
  linkParentFormLabels,
  linkParentFormPlaceholders,
  relationshipOptions,
  validateLinkParentForm,
  type LinkParentFormErrors,
  type LinkParentFormValues,
  type RelationshipOption,
} from "./link-parent-form";
import { sendParentInvitation } from "@/app/kids/[id]/actions";

type LinkParentModalProps = {
  open: boolean;
  childId: string;
  childName: string;
  onClose: () => void;
  onSuccess: (email: string) => void;
};

export function LinkParentModal({
  open,
  childId,
  childName,
  onClose,
  onSuccess,
}: LinkParentModalProps) {
  const [values, setValues] = useState<LinkParentFormValues>(
    initialLinkParentFormValues,
  );
  const [errors, setErrors] = useState<LinkParentFormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [invitationCode] = useState(generateInvitationCode);
  const [isPending, startTransition] = useTransition();
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const titleId = "link-parent-modal-title";

  useEffect(() => {
    if (!open) {
      return;
    }

    fullNameInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isPending) {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, isPending]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const updateField = (field: keyof LinkParentFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setGeneralError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError(null);
    const nextErrors = validateLinkParentForm(values);
    setErrors(nextErrors);

    if (hasLinkParentFormErrors(nextErrors)) {
      return;
    }

    startTransition(async () => {
      const result = await sendParentInvitation({
        childId,
        fullName: values.fullName,
        email: values.email,
        relationship: values.relationship,
        code: invitationCode,
      });

      if (!result.ok) {
        setErrors((current) => ({ ...current, ...(result.fieldErrors ?? {}) }));
        setGeneralError(result.message);
        return;
      }

      onSuccess(result.email);
      onClose();
    });
  };

  const inputBaseClassName =
    "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-3.25 text-[15px] text-[#3F362E] outline-none transition-colors placeholder:text-[#B6A99B] focus:border-[#F2A78E] disabled:opacity-60";
  const inputNormalBorderClassName = "border-[#EADFD0]";
  const inputErrorBorderClassName = "border-[#D9684A] focus:border-[#D9684A]";
  const labelClassName =
    "mb-2 block text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]";

  const isRelationshipSelected = (value: RelationshipOption["value"]) =>
    values.relationship === value;

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
        className="my-auto flex max-h-[calc(100vh-3rem)] w-full max-w-[480px] flex-col overflow-hidden rounded-3xl border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] sm:max-h-[calc(100vh-5rem)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#ECE0D0] px-5 py-5 sm:px-[26px]">
          <div>
            <h2
              id={titleId}
              className="m-0 font-(family-name:--font-fredoka) text-[18px] font-semibold text-[#3F362E]"
            >
              {linkParentFormLabels.title}
            </h2>
            <div className="text-[13px] text-[#A89A8B]">
              {linkParentFormLabels.subtitlePrefix} {childName}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            aria-label={linkParentFormLabels.close}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B] transition-colors hover:bg-[#E8DCCC] hover:text-[#7E7266] disabled:opacity-60"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="overflow-y-auto px-5 py-[22px] sm:px-[26px]"
        >
          <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-3.25">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4E72C8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-px flex-none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              {linkParentFormLabels.infoBanner(childName)}
            </span>
          </div>

          {generalError ? (
            <div className="mb-4 rounded-[14px] border border-[#F0C4B8] bg-[#FDEDEA] px-4 py-3 text-[13.5px] font-semibold text-[#B84C32]">
              {generalError}
            </div>
          ) : null}

          <div className="mb-4.5">
            <label htmlFor="link-parent-full-name" className={labelClassName}>
              {linkParentFormLabels.fullName}
            </label>
            <input
              ref={fullNameInputRef}
              id="link-parent-full-name"
              name="fullName"
              type="text"
              value={values.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder={linkParentFormPlaceholders.fullName}
              disabled={isPending}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={
                errors.fullName ? "link-parent-full-name-error" : undefined
              }
              className={`${inputBaseClassName} ${
                errors.fullName ? inputErrorBorderClassName : inputNormalBorderClassName
              }`}
            />
            {errors.fullName ? (
              <p
                id="link-parent-full-name-error"
                className="mt-2 text-[13px] font-semibold text-[#D9684A]"
              >
                {errors.fullName}
              </p>
            ) : null}
          </div>

          <div className="mb-4.5">
            <label htmlFor="link-parent-email" className={labelClassName}>
              {linkParentFormLabels.email}
            </label>
            <input
              id="link-parent-email"
              name="email"
              type="email"
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder={linkParentFormPlaceholders.email}
              disabled={isPending}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "link-parent-email-error" : undefined}
              className={`${inputBaseClassName} ${
                errors.email ? inputErrorBorderClassName : inputNormalBorderClassName
              }`}
            />
            {errors.email ? (
              <p
                id="link-parent-email-error"
                className="mt-2 text-[13px] font-semibold text-[#D9684A]"
              >
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="mb-5">
            <div className={`${labelClassName} mb-2.5`}>
              {linkParentFormLabels.relationship}
            </div>
            <div
              role="group"
              aria-label={linkParentFormLabels.relationship}
              aria-describedby={
                errors.relationship ? "link-parent-relationship-error" : undefined
              }
              className="flex gap-2.25"
            >
              {relationshipOptions.map((option) => {
                const selected = isRelationshipSelected(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    disabled={isPending}
                    onClick={() => updateField("relationship", option.value)}
                    className={`flex-1 rounded-full border-[1.5px] px-3 py-[11px] text-[14px] font-extrabold transition-colors disabled:opacity-60 ${
                      selected
                        ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                        : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359] hover:border-[#D8CBBA]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {errors.relationship ? (
              <p
                id="link-parent-relationship-error"
                className="mt-2 text-[13px] font-semibold text-[#D9684A]"
              >
                {errors.relationship}
              </p>
            ) : null}
          </div>

          <div className="mb-5 rounded-2xl border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] p-4.5 text-center">
            <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#A88526]">
              {linkParentFormLabels.invitationCode}
            </div>
            <div className="font-(family-name:--font-fredoka) text-[34px] font-semibold tracking-[7px] text-[#8A7234]">
              {invitationCode}
            </div>
            <div className="mt-[6px] text-[13px] text-[#A88526]">
              {linkParentFormLabels.expiresIn}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2.25 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="M22 2 11 13" />
            </svg>
            {isPending ? linkParentFormLabels.submitting : linkParentFormLabels.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
