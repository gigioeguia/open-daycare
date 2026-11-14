import { AppShell } from "../components/shell/AppShell";
import type { ShellNavItem } from "../components/shell/Sidebar";
import { BellIcon } from "../components/shell/icons/BellIcon";
import { ChildrenIcon } from "../components/shell/icons/ChildrenIcon";
import { HomeIcon } from "../components/shell/icons/HomeIcon";
import { UserIcon } from "../components/shell/icons/UserIcon";
import { KidsPageHeader } from "../components/kids/KidsPageHeader";
import { KidsRoomSection } from "../components/kids/KidsRoomSection";
import { KidsSearchInput } from "../components/kids/KidsSearchInput";
import { kidsPageData } from "../components/kids/kids-data";

const navItems: ShellNavItem[] = [
  { id: "feed", label: "Feed", href: "/", icon: <HomeIcon /> },
  { id: "children", label: "Niños", href: "/kids", active: true, icon: <ChildrenIcon /> },
  { id: "notices", label: "Avisos", href: "#", icon: <BellIcon /> },
  { id: "account", label: "Mi cuenta", href: "#", icon: <UserIcon /> },
];

export default function KidsPage() {
  return (
    <AppShell
      roomLabel="Sala Soles"
      brandHref="/"
      navItems={navItems}
      user={{
        name: "Caro Giménez",
        role: "Maestra · Soles",
        initial: "C",
        avatarBackgroundColor: "#F2937A",
        avatarColor: "#FFFFFF",
      }}
      contentClassName="mx-auto w-full max-w-[880px] px-5 py-8 sm:px-8 lg:px-10 lg:py-[34px] lg:pb-20"
    >
      <KidsPageHeader
        sectionLabel={kidsPageData.sectionLabel}
        title={kidsPageData.title}
        addChildLabel={kidsPageData.addChildLabel}
      />
      <KidsSearchInput placeholder={kidsPageData.searchPlaceholder} />
      <KidsRoomSection
        roomGroupLabel={kidsPageData.roomGroupLabel}
        roomGroupCountLabel={kidsPageData.roomGroupCountLabel}
        kids={kidsPageData.kids}
      />
    </AppShell>
  );
}
