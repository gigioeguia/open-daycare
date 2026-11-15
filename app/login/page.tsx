import { BrandCompactHeader } from "../components/auth/BrandCompactHeader";
import { BrandPanel } from "../components/auth/BrandPanel";
import { LoginForm } from "../components/auth/LoginForm";
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

          <LoginForm data={data} />
        </div>
      </div>
    </main>
  );
}
