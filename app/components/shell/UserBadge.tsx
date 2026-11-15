import { Avatar } from "./Avatar";
import { LogoutIcon } from "./icons/LogoutIcon";
import { signOut } from "@/app/auth/actions";

export type ShellUser = {
  name: string;
  role: string;
  initial: string;
  avatarBackgroundColor?: string;
  avatarColor?: string;
};

type UserBadgeProps = {
  user: ShellUser;
};

export function UserBadge({ user }: UserBadgeProps) {
  return (
    <div className="flex items-center gap-[11px] px-2 py-[6px]">
      <Avatar
        initial={user.initial}
        size={38}
        backgroundColor={user.avatarBackgroundColor ?? "#F2937A"}
        color={user.avatarColor ?? "#FFFFFF"}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-extrabold text-[#3F362E]">{user.name}</div>
        <div className="text-[12px] text-[#A89A8B]">{user.role}</div>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#F6ECDF] text-[#94887B]"
        >
          <LogoutIcon />
        </button>
      </form>
    </div>
  );
}
