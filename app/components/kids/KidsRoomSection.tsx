import { KidCard } from "./KidCard";
import type { KidListItem } from "./kids-data";

type KidsRoomSectionProps = {
  roomGroupLabel: string;
  roomGroupCountLabel: string;
  kids: KidListItem[];
};

export function KidsRoomSection({
  roomGroupLabel,
  roomGroupCountLabel,
  kids,
}: KidsRoomSectionProps) {
  return (
    <section>
      <div className="mb-[14px] flex items-center gap-3">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#3F362E]">
          {roomGroupLabel}
        </span>
        <span className="text-[13px] text-[#A89A8B]">{roomGroupCountLabel}</span>
        <span className="h-px flex-1 bg-[#E7DAC8]" />
      </div>
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        {kids.map((kid) => (
          <KidCard key={kid.id} kid={kid} />
        ))}
      </div>
    </section>
  );
}
