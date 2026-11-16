"use client";

import Link from "next/link";
import { useActionState } from "react";
import { activateAccount, type ActivateAccountState } from "@/app/activar-cuenta/actions";
import { AuthPrimaryAction } from "./AuthPrimaryAction";
import { AuthTextField } from "./AuthTextField";
import { ConsentNotice } from "./ConsentNotice";
import { InvitationSummary } from "./InvitationSummary";
import type { ActivateAccountPageData } from "./auth-data";

type ActivationFormProps = {
  data: ActivateAccountPageData;
  initialCode?: string;
  initialEmail?: string;
};

const initialState: ActivateAccountState = {};

export function ActivationForm({ data, initialCode, initialEmail }: ActivationFormProps) {
  const [state, formAction, isPending] = useActionState(activateAccount, initialState);

  return (
    <form action={formAction} noValidate>
      <InvitationSummary data={data.invitation} />

      {state.error ? (
        <div className="mb-4 rounded-[14px] border border-[#F0C4B8] bg-[#FDEDEA] px-4 py-3 text-[14px] font-semibold text-[#B84C32]">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-[18px]">
        <AuthTextField
          field={data.codeField}
          defaultValue={initialCode}
          required
          autoComplete="one-time-code"
          disabled={isPending}
          error={state.fieldErrors?.code}
          errorId="activate-code-error"
        />
        <AuthTextField
          field={data.emailField}
          defaultValue={initialEmail}
          required
          autoComplete="email"
          disabled={isPending}
          error={state.fieldErrors?.email}
          errorId="activate-email-error"
        />
        <AuthTextField
          field={data.passwordField}
          required
          autoComplete="new-password"
          disabled={isPending}
          error={state.fieldErrors?.password}
          errorId="activate-password-error"
        />
      </div>

      <div className="mt-4.5">
        <ConsentNotice
          data={data.consent}
          interactive
          name="consent"
          required
          disabled={isPending}
          error={state.fieldErrors?.consent}
          errorId="activate-consent-error"
        />
      </div>

      <AuthPrimaryAction
        type="submit"
        label={isPending ? data.submittingLabel ?? "Activando..." : data.submitLabel}
        disabled={isPending}
      />

      <p className="m-0 mt-[22px] text-center text-[14.5px] text-[#94887B]">
        {data.loginPrompt}{" "}
        <Link href={data.loginHref} className="font-extrabold text-[#C5503A]">
          {data.loginLinkLabel}
        </Link>
      </p>
    </form>
  );
}
