import Link from "next/link";
import { Avatar } from "../shell/Avatar";
import { ChevronLeftIcon } from "./icons/ChevronLeftIcon";
import type { KidProfile } from "./kids-data";

type KidProfileHeaderProps = {
  backLabel: string;
  editLabel: string;
  profile: KidProfile;
};

export function KidProfileHeader({
  backLabel,
  editLabel,
  profile,
}: KidProfileHeaderProps) {
  return (
    <div>
      <Link
        href="/kids"
        className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-[#94887B]"
      >
        <ChevronLeftIcon />
        {backLabel}
      </Link>
      <div className="flex flex-wrap items-center gap-[18px]">
        <Avatar
          initial={profile.initial}
          size={84}
          backgroundColor={profile.avatarBackground}
          color={profile.avatarColor}
          className="text-[34px]"
        />
        <div className="min-w-[180px] flex-1">
          <h1 className="m-0 font-[family-name:var(--font-fredoka)] text-[28px] font-semibold text-[#3F362E]">
            {profile.name}
          </h1>
          <p className="m-0 mt-[3px] text-[15px] text-[#94887B]">
            {profile.ageLabel} · {profile.roomLabel}
          </p>
        </div>
        <a
          href="#"
          className="rounded-[12px] border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] px-4 py-[9px] text-[14px] font-bold text-[#6E6359]"
        >
          {editLabel}
        </a>
      </div>
    </div>
  );
}
