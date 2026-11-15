import Link from "next/link";
import { AuthPrimaryAction } from "../components/auth/AuthPrimaryAction";
import { AuthTextField } from "../components/auth/AuthTextField";
import { BrandCompactHeader } from "../components/auth/BrandCompactHeader";
import { BrandPanel } from "../components/auth/BrandPanel";
import { loginPageData } from "../components/auth/auth-data";

export default function LoginPage() {
  const data = loginPageData;

  return (
    <main className="min-h-screen bg-[#FBF4EC] lg:grid lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel data={data.brandPanel} />

      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-10">
        <div className="w-full max-w-[392px]">
          <BrandCompactHeader
            brandName={data.brandPanel.brandName}
            contextLabel={data.brandPanel.contextLabel}
          />

          <h2 className="m-0 mb-[6px] font-(family-name:--font-fredoka) text-[30px] font-semibold text-[#3F362E]">
            {data.title}
          </h2>
          <p className="m-0 mb-7 text-[15px] text-[#94887B]">{data.subtitle}</p>

          <div className="space-y-[18px]">
            <AuthTextField field={data.emailField} />
            <AuthTextField field={data.passwordField} />
          </div>

          <div className="mb-5 mt-2.5 text-right">
            <Link
              href={data.forgotPasswordHref}
              className="text-[13.5px] font-bold text-[#C5503A]"
            >
              {data.forgotPasswordLabel}
            </Link>
          </div>

          <AuthPrimaryAction href={data.submitHref} label={data.submitLabel} />

          <p className="m-0 mt-6 text-center text-[14.5px] text-[#94887B]">
            {data.invitePrompt}{" "}
            <Link href={data.inviteHref} className="font-extrabold text-[#C5503A]">
              {data.inviteLinkLabel}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
