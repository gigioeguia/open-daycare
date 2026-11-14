import type { FeedUser } from "./feed-data";
import { Avatar } from "./Avatar";
import { LogoutIcon } from "./icons/LogoutIcon";

type UserBadgeProps = {
  user: FeedUser;
};

export function UserBadge({ user }: UserBadgeProps) {
  return (
    <div className="flex items-center gap-[11px] px-2 py-[6px]">
      <Avatar initial={user.initial} size={38} backgroundColor="#F2937A" color="#FFFFFF" />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-extrabold text-[#3F362E]">{user.name}</div>
        <div className="text-[12px] text-[#A89A8B]">{user.role}</div>
      </div>
      <a
        href="#"
        title="Cerrar sesión"
        className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#F6ECDF] text-[#94887B]"
      >
        <LogoutIcon />
      </a>
    </div>
  );
}
