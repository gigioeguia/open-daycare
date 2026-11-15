import type { InvitationSummaryData } from "./auth-data";

type InvitationSummaryProps = {
  data: InvitationSummaryData;
};

export function InvitationSummary({ data }: InvitationSummaryProps) {
  return (
    <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px]">
      <div
        className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full font-[family-name:var(--font-fredoka)] text-[19px] font-semibold"
        style={{ backgroundColor: data.avatarBackground, color: data.avatarColor }}
      >
        {data.initial}
      </div>
      <div>
        <div className="text-[13px] text-[#94887B]">{data.promptLabel}</div>
        <div className="font-[family-name:var(--font-fredoka)] text-[17px] font-semibold text-[#3F362E]">
          {data.childLabel}
        </div>
      </div>
    </div>
  );
}
