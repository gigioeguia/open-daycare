import Link from "next/link";
import { AuthPrimaryAction } from "../components/auth/AuthPrimaryAction";
import { AuthTextField } from "../components/auth/AuthTextField";
import { ConsentNotice } from "../components/auth/ConsentNotice";
import { InvitationSummary } from "../components/auth/InvitationSummary";
import { SunMarkIcon } from "../components/auth/SunMarkIcon";
import { activateAccountPageData } from "../components/auth/auth-data";

export default function ActivateAccountPage() {
  const data = activateAccountPageData;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBF4EC] p-6 sm:p-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <SunMarkIcon className="text-white" size={30} />
        </div>

        <h1 className="m-0 mb-2 font-[family-name:var(--font-fredoka)] text-[32px] font-semibold leading-[1.15] text-[#3F362E]">
          {data.title}
        </h1>
        <p className="m-0 mb-[26px] text-[15.5px] leading-[1.55] text-[#94887B]">
          {data.subtitle}
        </p>

        <InvitationSummary data={data.invitation} />

        <div className="space-y-[18px]">
          <AuthTextField field={data.codeField} />
          <AuthTextField field={data.emailField} />
          <AuthTextField field={data.passwordField} />
        </div>

        <div className="mt-[18px]">
          <ConsentNotice data={data.consent} />
        </div>

        <AuthPrimaryAction href={data.submitHref} label={data.submitLabel} />

        <p className="m-0 mt-[22px] text-center text-[14.5px] text-[#94887B]">
          {data.loginPrompt}{" "}
          <Link href={data.loginHref} className="font-extrabold text-[#C5503A]">
            {data.loginLinkLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
