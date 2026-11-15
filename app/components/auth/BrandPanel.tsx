import type { BrandPanelData } from "./auth-data";
import { SunMarkIcon } from "./SunMarkIcon";

type BrandPanelProps = {
  data: BrandPanelData;
};

export function BrandPanel({ data }: BrandPanelProps) {
  const [titleLine1, titleLine2] = data.title.split("\n");

  return (
    <div className="relative hidden overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] p-[56px_60px] text-white lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-white/12" />
      <div className="pointer-events-none absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/10" />

      <div className="relative flex items-center gap-[13px]">
        <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/22">
          <SunMarkIcon className="text-white" />
        </div>
        <span className="font-[family-name:var(--font-fredoka)] text-[21px] font-semibold tracking-[0.5px]">
          {data.brandName}
        </span>
      </div>

      <div className="relative">
        <h1 className="m-0 mb-[18px] font-[family-name:var(--font-fredoka)] text-[42px] font-semibold leading-[1.12]">
          {titleLine1}
          {titleLine2 ? (
            <>
              <br />
              {titleLine2}
            </>
          ) : null}
        </h1>
        <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-white/92">
          {data.description}
        </p>
      </div>

      <div className="relative text-[14px] text-white/90">{data.contextLabel}</div>
    </div>
  );
}
