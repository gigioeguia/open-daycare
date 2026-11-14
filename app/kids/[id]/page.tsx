import Link from "next/link";
import { AppShell } from "../../components/shell/AppShell";
import type { ShellNavItem } from "../../components/shell/Sidebar";
import { BellIcon } from "../../components/shell/icons/BellIcon";
import { ChildrenIcon } from "../../components/shell/icons/ChildrenIcon";
import { HomeIcon } from "../../components/shell/icons/HomeIcon";
import { SunIcon } from "../../components/shell/icons/SunIcon";
import { UserIcon } from "../../components/shell/icons/UserIcon";
import { KidAllergyNotice } from "../../components/kids/KidAllergyNotice";
import { KidInfoCard } from "../../components/kids/KidInfoCard";
import { KidParentsCard } from "../../components/kids/KidParentsCard";
import { KidProfileHeader } from "../../components/kids/KidProfileHeader";
import { getKidProfileById, kidProfilePageDataBase } from "../../components/kids/kids-data";

export const instant = false;

type KidProfilePageProps = {
  params: Promise<{ id: string }>;
};

const navItems: ShellNavItem[] = [
  { id: "feed", label: "Feed", href: "/", icon: <HomeIcon /> },
  { id: "children", label: "Niños", href: "/kids", active: true, icon: <ChildrenIcon /> },
  { id: "notices", label: "Avisos", href: "#", icon: <BellIcon /> },
  { id: "account", label: "Mi cuenta", href: "#", icon: <UserIcon /> },
];

export default async function KidProfilePage({ params }: KidProfilePageProps) {
  const { id } = await params;
  const profile = getKidProfileById(id);

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
      contentClassName="mx-auto w-full max-w-[820px] px-5 py-8 sm:px-8 lg:px-10 lg:py-[34px] lg:pb-20"
    >
      {!profile ? (
        <div className="rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-6">
          <h1 className="m-0 font-[family-name:var(--font-fredoka)] text-[24px] font-semibold text-[#3F362E]">
            Perfil no encontrado
          </h1>
          <p className="mt-2 text-[15px] text-[#94887B]">
            No encontramos un niño con este identificador.
          </p>
          <Link
            href="/kids"
            className="mt-4 inline-flex items-center rounded-[12px] bg-[#3F362E] px-4 py-[10px] text-[14px] font-extrabold text-white"
          >
            Volver a Niños
          </Link>
        </div>
      ) : (
        <div>
          <KidProfileHeader
            backLabel={kidProfilePageDataBase.backLabel}
            editLabel={kidProfilePageDataBase.editLabel}
            profile={profile}
          />
          <div className="mt-[18px] flex flex-col gap-[26px] lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-[18px] lg:min-w-[300px]">
              {profile.allergyTitle && profile.allergyNote ? (
                <KidAllergyNotice title={profile.allergyTitle} note={profile.allergyNote} />
              ) : null}
              <KidInfoCard profile={profile} />
            </div>
            <div className="flex w-full flex-none flex-col gap-[14px] lg:w-[300px]">
              <a
                href="#"
                className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[#3F362E] px-[13px] py-[13px] text-[15px] font-extrabold text-white"
              >
                <SunIcon className="text-white" />
                {kidProfilePageDataBase.daySummaryLabel}
              </a>
              <KidParentsCard
                sectionLabel={kidProfilePageDataBase.parentsSectionLabel}
                linkAnotherParentLabel={kidProfilePageDataBase.linkAnotherParentLabel}
                parents={profile.parents}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
