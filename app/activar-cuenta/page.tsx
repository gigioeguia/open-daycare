import { Suspense } from "react";
import { SunMarkIcon } from "../components/auth/SunMarkIcon";
import { ActivationForm } from "../components/auth/ActivationForm";
import { activateAccountPageData } from "../components/auth/auth-data";

export const instant = false;

type ActivateAccountPageProps = {
  searchParams?: Promise<{ code?: string; email?: string }>;
};

async function ActivateAccountContent({ searchParams }: ActivateAccountPageProps) {
  const data = activateAccountPageData;
  const params = (await searchParams) ?? {};
  const initialCode = typeof params.code === "string" ? params.code : undefined;
  const initialEmail = typeof params.email === "string" ? params.email : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBF4EC] p-6 sm:p-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
          <SunMarkIcon className="text-white" size={30} />
        </div>

        <h1 className="m-0 mb-2 font-(family-name:--font-fredoka) text-[32px] font-semibold leading-[1.15] text-[#3F362E]">
          {data.title}
        </h1>
        <p className="m-0 mb-6.5 text-[15.5px] leading-[1.55] text-[#94887B]">
          {data.subtitle}
        </p>

        <ActivationForm
          data={data}
          initialCode={initialCode}
          initialEmail={initialEmail}
        />
      </div>
    </main>
  );
}

export default function ActivateAccountPage(props: ActivateAccountPageProps) {
  return (
    <Suspense fallback={null}>
      <ActivateAccountContent {...props} />
    </Suspense>
  );
}
