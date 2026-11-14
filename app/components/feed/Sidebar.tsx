import type { NavItem, FeedUser } from "./feed-data";
import { BellIcon } from "./icons/BellIcon";
import { ChildrenIcon } from "./icons/ChildrenIcon";
import { HomeIcon } from "./icons/HomeIcon";
import { PlusIcon } from "./icons/PlusIcon";
import { SunIcon } from "./icons/SunIcon";
import { UserIcon } from "./icons/UserIcon";
import { SidebarNavItem } from "./SidebarNavItem";
import { UserBadge } from "./UserBadge";

type SidebarProps = {
  navItems: NavItem[];
  user: FeedUser;
  className?: string;
};

function getNavIcon(id: NavItem["id"]) {
  switch (id) {
    case "feed":
      return <HomeIcon />;
    case "children":
      return <ChildrenIcon />;
    case "notices":
      return <BellIcon />;
    case "account":
      return <UserIcon />;
  }
}

export function Sidebar({ navItems, user, className = "" }: SidebarProps) {
  return (
    <aside
      className={`flex h-screen w-[248px] flex-none flex-col border-r border-[#ECE0D0] bg-[#FFFDF9] px-4 py-6 ${className}`}
    >
      <a href="#" className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] text-white">
          <SunIcon />
        </div>
        <div>
          <div className="font-[family-name:var(--font-fredoka)] text-[17px] font-semibold leading-none text-[#3F362E]">
            OpenDayCare
          </div>
          <div className="mt-[2px] text-[11.5px] text-[#A89A8B]">Sala Lunas</div>
        </div>
      </a>

      <a
        href="#"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
      >
        <PlusIcon />
        Nueva publicación
      </a>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.id}
            href="#"
            icon={getNavIcon(item.id)}
            label={item.label}
            active={item.active}
          />
        ))}
      </nav>

      <div className="mt-[10px] border-t border-[#ECE0D0] pt-[14px]">
        <UserBadge user={user} />
      </div>
    </aside>
  );
}
