import Link from "next/link";
import type { ReactNode } from "react";
import { PlusIcon } from "./icons/PlusIcon";
import { SunIcon } from "./icons/SunIcon";
import { SidebarNavItem } from "./SidebarNavItem";
import { UserBadge, type ShellUser } from "./UserBadge";

export type ShellNavItem = {
  id: string;
  label: string;
  href: string;
  active?: boolean;
  icon: ReactNode;
};

type SidebarProps = {
  roomLabel: string;
  brandHref?: string;
  newPostLabel?: string;
  newPostHref?: string;
  onNewPostClick?: () => void;
  showNewPost?: boolean;
  navItems: ShellNavItem[];
  user: ShellUser;
  className?: string;
};

export function Sidebar({
  roomLabel,
  brandHref = "#",
  newPostLabel = "Nueva publicación",
  newPostHref = "#",
  onNewPostClick,
  showNewPost = true,
  navItems,
  user,
  className = "",
}: SidebarProps) {
  const newPostClassName =
    "mb-4.5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]";
  return (
    <aside
      className={`flex h-screen w-[248px] flex-none flex-col border-r border-[#ECE0D0] bg-[#FFFDF9] px-4 py-6 ${className}`}
    >
      <Link
        href={brandHref}
        className="flex items-center gap-[11px] px-2 pb-[22px] pt-1"
      >
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] text-white">
          <SunIcon />
        </div>
        <div>
          <div className="font-(family-name:--font-fredoka) text-[17px] font-semibold leading-none text-[#3F362E]">
            OpenDayCare
          </div>
          <div className="mt-[2px] text-[11.5px] text-[#A89A8B]">{roomLabel}</div>
        </div>
      </Link>

      {showNewPost ? (
        onNewPostClick ? (
          <button
            type="button"
            onClick={onNewPostClick}
            className={newPostClassName}
          >
            <PlusIcon />
            {newPostLabel}
          </button>
        ) : (
          <a href={newPostHref} className={newPostClassName}>
            <PlusIcon />
            {newPostLabel}
          </a>
        )
      ) : null}

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={item.active}
          />
        ))}
      </nav>

      <div className="mt-2.5 border-t border-[#ECE0D0] pt-3.5">
        <UserBadge user={user} />
      </div>
    </aside>
  );
}
