import { WarningIcon } from "./icons/WarningIcon";

type KidAllergyNoticeProps = {
  title: string;
  note: string;
};

export function KidAllergyNotice({ title, note }: KidAllergyNoticeProps) {
  return (
    <div className="flex gap-3.5 rounded-2xl bg-[#FBDAD6] p-[16px_18px]">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
        <WarningIcon />
      </div>
      <div>
        <div className="mb-[2px] text-[15px] font-extrabold text-[#C5413A]">{title}</div>
        <div className="text-[14.5px] leading-[1.5] text-[#B25249]">{note}</div>
      </div>
    </div>
  );
}
