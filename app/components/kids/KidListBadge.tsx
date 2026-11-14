import type { KidListBadgeTone } from "./kids-data";

type KidListBadgeProps = {
  label: string;
  tone: KidListBadgeTone;
};

const toneStyles: Record<KidListBadgeTone, string> = {
  allergy: "bg-[#FBD8CC] text-[#D9684A]",
  link: "bg-[#F9D2DE] text-[#C56486]",
};

export function KidListBadge({ label, tone }: KidListBadgeProps) {
  return (
    <span
      className={`flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold ${toneStyles[tone]}`}
    >
      {label}
    </span>
  );
}
