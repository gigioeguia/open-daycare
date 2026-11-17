import { Suspense } from "react";
import { connection } from "next/server";
import { AppShell } from "@/app/components/shell/AppShell";
import type { ShellNavItem } from "@/app/components/shell/Sidebar";
import { BellIcon } from "@/app/components/shell/icons/BellIcon";
import { ChildrenIcon } from "@/app/components/shell/icons/ChildrenIcon";
import { HomeIcon } from "@/app/components/shell/icons/HomeIcon";
import { UserIcon } from "@/app/components/shell/icons/UserIcon";
import { KidsRoomSection } from "@/app/components/kids/KidsRoomSection";
import { KidsSearchInput } from "@/app/components/kids/KidsSearchInput";
import type { KidListItem } from "@/app/components/kids/kids-data";
import {
  KIDS_LINKED_PARENTS_LABEL,
  calculateAgeLabel,
  getKidAvatarPalette,
  getKidInitial,
} from "@/app/components/kids/kids-list-presentation";
import { getCurrentUserProfile } from "@/utils/supabase/get-current-user-profile";
import { getKidsList } from "@/utils/supabase/get-kids-list";

type KidsPageSearchParams = {
  q?: string | string[];
};

type KidsPageProps = {
  searchParams?: Promise<KidsPageSearchParams> | KidsPageSearchParams;
};

type KidsRoomGroup = {
  roomName: string;
  kids: KidListItem[];
};

const navItems: ShellNavItem[] = [
  { id: "feed", label: "Feed", href: "/family", icon: <HomeIcon /> },
  { id: "children", label: "Mis hijos", href: "/family/kids", active: true, icon: <ChildrenIcon /> },
  { id: "notices", label: "Avisos", href: "#", icon: <BellIcon /> },
  { id: "account", label: "Mi cuenta", href: "#", icon: <UserIcon /> },
];

const fallbackUser = {
  name: "Usuario",
  role: "Familiar · Guardería",
  initial: "U",
  avatarBackgroundColor: "#F2937A",
  avatarColor: "#FFFFFF",
};

function getKidsCountLabel(count: number): string {
  return count === 1 ? "1 niño" : `${count} niños`;
}

function getRoomGroups(kids: KidListItem[]): KidsRoomGroup[] {
  const groupsByRoom = new Map<string, KidListItem[]>();

  for (const kid of kids) {
    const roomKids = groupsByRoom.get(kid.roomName ?? "Sala") ?? [];
    roomKids.push(kid);
    groupsByRoom.set(kid.roomName ?? "Sala", roomKids);
  }

  return Array.from(groupsByRoom.entries())
    .sort(([leftRoom], [rightRoom]) => leftRoom.localeCompare(rightRoom, "es"))
    .map(([roomName, roomKids]) => ({ roomName, kids: roomKids }));
}

async function FamilyKidsPageContent({ searchParams }: KidsPageProps) {
  await connection();
  const resolvedSearchParams = (await searchParams) ?? {};
  const queryParam = resolvedSearchParams.q;
  const query = Array.isArray(queryParam) ? queryParam[0] ?? "" : queryParam ?? "";
  const trimmedQuery = query.trim();

  let currentUser: Awaited<ReturnType<typeof getCurrentUserProfile>> = null;
  let kids: KidListItem[] = [];
  let loadError = false;

  try {
    const [profile, rows] = await Promise.all([
      getCurrentUserProfile(),
      getKidsList(trimmedQuery),
    ]);

    currentUser = profile;
    kids = rows.map((row) => {
      const palette = getKidAvatarPalette(row.fullName);

      return {
        id: row.id,
        name: row.fullName,
        ageLabel: calculateAgeLabel(row.birthDate),
        linkedParentsLabel: KIDS_LINKED_PARENTS_LABEL,
        initial: getKidInitial(row.fullName),
        avatarBackground: palette.avatarBackground,
        avatarColor: palette.avatarColor,
        roomName: row.roomName,
        showChevron: false,
      };
    });
  } catch {
    loadError = true;
    try {
      currentUser = await getCurrentUserProfile();
    } catch {
      currentUser = null;
    }
  }

  const roomGroups = getRoomGroups(kids);

  return (
    <AppShell
      roomLabel={currentUser ? currentUser.role.split(" · ")[1] ?? "Familia" : "Familia"}
      brandHref="/family"
      navItems={navItems}
      showNewPost={false}
      user={currentUser ?? fallbackUser}
      contentClassName="mx-auto w-full max-w-[880px] px-5 py-8 sm:px-8 lg:px-10 lg:py-[34px] lg:pb-20"
    >
      <div className="mb-[22px]">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C]">
          FAMILIA
        </div>
        <h1 className="m-0 font-(family-name:--font-fredoka) text-[30px] font-semibold text-[#3F362E]">
          Mis hijos
        </h1>
      </div>
      <KidsSearchInput
        key={trimmedQuery}
        placeholder="Buscar hijo…"
        query={trimmedQuery}
      />

      {loadError ? (
        <div className="rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-5 text-[15px] text-[#94887B]">
          No pudimos cargar la información. Intenta nuevamente.
        </div>
      ) : kids.length === 0 ? (
        <div className="rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-5 text-[15px] text-[#94887B]">
          {trimmedQuery
            ? `No se encontraron hijos para "${trimmedQuery}".`
            : "No hay hijos vinculados para mostrar."}
        </div>
      ) : (
        <div className="flex flex-col gap-[22px]">
          {roomGroups.map((group) => (
            <KidsRoomSection
              key={group.roomName}
              roomGroupLabel={group.roomName.toUpperCase()}
              roomGroupCountLabel={getKidsCountLabel(group.kids.length)}
              kids={group.kids}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

export default function FamilyKidsPage(props: KidsPageProps) {
  return (
    <Suspense fallback={null}>
      <FamilyKidsPageContent {...props} />
    </Suspense>
  );
}
