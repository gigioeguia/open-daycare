import { SunMarkIcon } from "./SunMarkIcon";

type BrandCompactHeaderProps = {
  brandName: string;
  contextLabel: string;
};

export function BrandCompactHeader({
  brandName,
  contextLabel,
}: BrandCompactHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] px-4 py-3 text-white lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/22">
          <SunMarkIcon className="text-white" size={22} />
        </div>
        <span className="font-(family-name:--font-fredoka) text-[18px] font-semibold tracking-[0.3px]">
          {brandName}
        </span>
      </div>
      <span className="text-[12px] text-white/90">{contextLabel}</span>
    </div>
  );
}
