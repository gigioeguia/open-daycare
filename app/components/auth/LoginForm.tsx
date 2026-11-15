"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type LoginState } from "@/app/login/actions";
import { AuthPrimaryAction } from "./AuthPrimaryAction";
import { AuthTextField } from "./AuthTextField";
import type { LoginPageData } from "./auth-data";

type LoginFormProps = {
  data: LoginPageData;
};

const initialState: LoginState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <AuthPrimaryAction
      type="submit"
      label={pending ? "Ingresando..." : label}
      disabled={pending}
    />
  );
}

export function LoginForm({ data }: LoginFormProps) {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <form action={formAction} noValidate>
      <div className="space-y-[18px]">
        <AuthTextField
          field={data.emailField}
          required
          autoComplete="email"
        />
        <AuthTextField
          field={data.passwordField}
          required
          autoComplete="current-password"
        />
      </div>

      {state.error ? (
        <p
          className="mt-3 rounded-[12px] border border-[#F1C2B8] bg-[#FFF1EE] px-3 py-2 text-[13.5px] font-semibold text-[#B5473A]"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="mb-5 mt-2.5 text-right">
        <Link
          href={data.forgotPasswordHref}
          className="text-[13.5px] font-bold text-[#C5503A]"
        >
          {data.forgotPasswordLabel}
        </Link>
      </div>

      <SubmitButton label={data.submitLabel} />

      <p className="m-0 mt-6 text-center text-[14.5px] text-[#94887B]">
        {data.invitePrompt}{" "}
        <Link href={data.inviteHref} className="font-extrabold text-[#C5503A]">
          {data.inviteLinkLabel}
        </Link>
      </p>
    </form>
  );
}
