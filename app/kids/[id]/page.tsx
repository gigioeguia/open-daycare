import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { AppShell } from "../../components/shell/AppShell";
import type { ShellNavItem } from "../../components/shell/Sidebar";
import { BellIcon } from "../../components/shell/icons/BellIcon";
import { ChildrenIcon } from "../../components/shell/icons/ChildrenIcon";
import { HomeIcon } from "../../components/shell/icons/HomeIcon";
import { SunIcon } from "../../components/shell/icons/SunIcon";
import { UserIcon } from "../../components/shell/icons/UserIcon";
import { KidAllergyNotice } from "../../components/kids/KidAllergyNotice";
import { KidInfoCard } from "../../components/kids/KidInfoCard";
import { KidParentsSection } from "../../components/kids/KidParentsSection";
import { KidProfileHeader } from "../../components/kids/KidProfileHeader";
import { getKidProfileById, kidProfilePageDataBase } from "../../components/kids/kids-data";
import { getCurrentUserProfile } from "@/utils/supabase/get-current-user-profile";

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

const fallbackUser = {
  name: "Usuario",
  role: "Personal · Guardería",
  initial: "U",
  avatarBackgroundColor: "#F2937A",
  avatarColor: "#FFFFFF",
};

async function KidProfileContent({ params }: KidProfilePageProps) {
  await connection();
  const { id } = await params;
  const [profile, currentUser] = await Promise.all([
    Promise.resolve(getKidProfileById(id)),
    getCurrentUserProfile(),
  ]);

  return (
    <AppShell
      roomLabel="Sala Soles"
      brandHref="/"
      navItems={navItems}
      user={currentUser ?? fallbackUser}
      contentClassName="mx-auto w-full max-w-[820px] px-5 py-8 sm:px-8 lg:px-10 lg:py-[34px] lg:pb-20"
    >
      {!profile ? (
        <div className="rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-6">
          <h1 className="m-0 font-(family-name:--font-fredoka) text-[24px] font-semibold text-[#3F362E]">
            Perfil no encontrado
          </h1>
          <p className="mt-2 text-[15px] text-[#94887B]">
            No encontramos un niño con este identificador.
          </p>
          <Link
            href="/kids"
            className="mt-4 inline-flex items-center rounded-xl bg-[#3F362E] px-4 py-2.5 text-[14px] font-extrabold text-white"
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
          <div className="mt-4.5 flex flex-col gap-6.5 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-4.5 lg:min-w-75">
              {profile.allergyTitle && profile.allergyNote ? (
                <KidAllergyNotice title={profile.allergyTitle} note={profile.allergyNote} />
              ) : null}
              <KidInfoCard profile={profile} />
            </div>
            <div className="flex w-full flex-none flex-col gap-3.5 lg:w-75">
              <a
                href="#"
                className="flex w-full items-center justify-center gap-2.25 rounded-[14px] bg-[#3F362E] px-3.25 py-3.25 text-[15px] font-extrabold text-white"
              >
                <SunIcon className="text-white" />
                {kidProfilePageDataBase.daySummaryLabel}
              </a>
              <KidParentsSection
                childName={profile.name}
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

export default function KidProfilePage(props: KidProfilePageProps) {
  return (
    <Suspense fallback={null}>
      <KidProfileContent {...props} />
    </Suspense>
  );
}
