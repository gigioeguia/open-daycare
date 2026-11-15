import type { InvitationSummaryData } from "./auth-data";

type InvitationSummaryProps = {
  data: InvitationSummaryData;
};

export function InvitationSummary({ data }: InvitationSummaryProps) {
  return (
    <div className="mb-5.5 flex items-center gap-3.5 rounded-2xl border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5">
      <div
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full font-(family-name:--font-fredoka) text-[19px] font-semibold"
        style={{ backgroundColor: data.avatarBackground, color: data.avatarColor }}
      >
        {data.initial}
      </div>
      <div>
        <div className="text-[13px] text-[#94887B]">{data.promptLabel}</div>
        <div className="font-(family-name:--font-fredoka) text-[17px] font-semibold text-[#3F362E]">
          {data.childLabel}
        </div>
      </div>
    </div>
  );
}
