import Link from "next/link";
import { Avatar } from "../shell/Avatar";
import { ChevronRightIcon } from "./icons/ChevronRightIcon";
import { KidListBadge } from "./KidListBadge";
import type { KidListItem } from "./kids-data";

type KidCardProps = {
  kid: KidListItem;
};

export function KidCard({ kid }: KidCardProps) {
  return (
    <Link
      href={`/kids/${kid.id}`}
      className="group flex min-w-0 items-center gap-[14px] rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition duration-150 hover:-translate-y-[2px] hover:border-[#F2A78E]"
    >
      <Avatar
        initial={kid.initial}
        size={48}
        backgroundColor={kid.avatarBackground}
        color={kid.avatarColor}
        className="text-[19px]"
      />
      <div className="min-w-0 flex-1">
        <div className="font-[family-name:var(--font-fredoka)] text-[16px] font-semibold text-[#3F362E]">
          {kid.name}
        </div>
        <div className="text-[13px] text-[#A89A8B]">
          {kid.ageLabel} · {kid.linkedParentsLabel}
        </div>
      </div>
      {kid.badgeLabel && kid.badgeTone ? (
        <KidListBadge label={kid.badgeLabel} tone={kid.badgeTone} />
      ) : null}
      {kid.showChevron ? (
        <span className="flex-none">
          <ChevronRightIcon />
        </span>
      ) : null}
    </Link>
  );
}
