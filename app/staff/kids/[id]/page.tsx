import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { AppShell } from "@/app/components/shell/AppShell";
import type { ShellNavItem } from "@/app/components/shell/Sidebar";
import { BellIcon } from "@/app/components/shell/icons/BellIcon";
import { ChildrenIcon } from "@/app/components/shell/icons/ChildrenIcon";
import { HomeIcon } from "@/app/components/shell/icons/HomeIcon";
import { SunIcon } from "@/app/components/shell/icons/SunIcon";
import { UserIcon } from "@/app/components/shell/icons/UserIcon";
import { KidAllergyNotice } from "@/app/components/kids/KidAllergyNotice";
import { KidInfoCard } from "@/app/components/kids/KidInfoCard";
import { KidParentsSection } from "@/app/components/kids/KidParentsSection";
import { KidProfileHeader } from "@/app/components/kids/KidProfileHeader";
import { kidProfilePageDataBase, type KidProfile, type LinkedParent } from "@/app/components/kids/kids-data";
import {
  calculateAgeLabel,
  formatKidAdmissionLabel,
  formatKidBirthDateLabel,
  getKidAvatarPalette,
  getKidInitial,
  getKidLinkedParentRelationLabel,
} from "@/app/components/kids/kids-list-presentation";
import { getCurrentUserProfile } from "@/utils/supabase/get-current-user-profile";
import {
  getKidProfileById,
  type KidLinkedParentRecord,
  type KidProfileRecord,
} from "@/utils/supabase/get-kid-profile";

export const instant = false;

type KidProfilePageProps = {
  params: Promise<{ id: string }>;
};

const navItems: ShellNavItem[] = [
  { id: "feed", label: "Feed", href: "/staff", icon: <HomeIcon /> },
  { id: "children", label: "Niños", href: "/staff/kids", active: true, icon: <ChildrenIcon /> },
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

function getAllergyNote(
  medicalNotes: string | null,
  allergyTags: string[] | null,
): string {
  const trimmedMedicalNotes = medicalNotes?.trim() ?? "";
  const tags = (allergyTags ?? []).map((tag) => tag.trim()).filter(Boolean);

  const parts: string[] = [];

  if (trimmedMedicalNotes) {
    parts.push(trimmedMedicalNotes);
  }

  if (tags.length > 0) {
    parts.push(`Alergias: ${tags.join(", ")}`);
  }

  if (parts.length === 0) {
    return "Sin novedad";
  }

  return parts.join("\n");
}

function mapLinkedParent(record: KidLinkedParentRecord): LinkedParent {
  const palette = getKidAvatarPalette(record.fullName);

  return {
    id: record.id,
    name: record.fullName,
    relationLabel: getKidLinkedParentRelationLabel(record.relationship),
    initial: getKidInitial(record.fullName),
    avatarBackground: palette.avatarBackground,
    status: "active",
    statusLabel: "ACTIVA",
  };
}

function mapKidProfile(record: KidProfileRecord): KidProfile {
  const palette = getKidAvatarPalette(record.child.fullName);
  const allergyNote = getAllergyNote(
    record.child.medicalNotes,
    record.child.allergyTags,
  );

  return {
    id: record.child.id,
    name: record.child.fullName,
    ageLabel: calculateAgeLabel(record.child.birthDate),
    roomLabel: record.child.roomName ?? "Sin sala",
    initial: getKidInitial(record.child.fullName),
    avatarBackground: palette.avatarBackground,
    avatarColor: palette.avatarColor,
    birthDateLabel: formatKidBirthDateLabel(record.child.birthDate),
    admissionLabel: formatKidAdmissionLabel(record.child.enrolledAt),
    allergyTitle: "Alergias y notas",
    allergyNote,
    parents: record.linkedParents.map(mapLinkedParent),
  };
}

async function StaffKidProfileContent({ params }: KidProfilePageProps) {
  await connection();
  const { id } = await params;

  let currentUser: Awaited<ReturnType<typeof getCurrentUserProfile>> = null;
  let profileRecord: KidProfileRecord | null = null;
  let loadError = false;

  try {
    const [record, user] = await Promise.all([
      getKidProfileById(id),
      getCurrentUserProfile(),
    ]);

    profileRecord = record;
    currentUser = user;
  } catch {
    loadError = true;
    try {
      currentUser = await getCurrentUserProfile();
    } catch {
      currentUser = null;
    }
  }

  const profile = profileRecord ? mapKidProfile(profileRecord) : null;

  return (
    <AppShell
      roomLabel={profile?.roomLabel ?? "Sala"}
      brandHref="/staff"
      navItems={navItems}
      showNewPost={false}
      user={currentUser ?? fallbackUser}
      contentClassName="mx-auto w-full max-w-[820px] px-5 py-8 sm:px-8 lg:px-10 lg:py-[34px] lg:pb-20"
    >
      {loadError ? (
        <div className="rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-6">
          <h1 className="m-0 font-(family-name:--font-fredoka) text-[24px] font-semibold text-[#3F362E]">
            No pudimos cargar el perfil
          </h1>
          <p className="mt-2 text-[15px] text-[#94887B]">
            No pudimos cargar el perfil. Intenta nuevamente.
          </p>
          <Link
            href="/staff/kids"
            className="mt-4 inline-flex items-center rounded-xl bg-[#3F362E] px-4 py-2.5 text-[14px] font-extrabold text-white"
          >
            Volver a Niños
          </Link>
        </div>
      ) : !profile ? (
        <div className="rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-6">
          <h1 className="m-0 font-(family-name:--font-fredoka) text-[24px] font-semibold text-[#3F362E]">
            Perfil no encontrado
          </h1>
          <p className="mt-2 text-[15px] text-[#94887B]">
            No encontramos un niño con este identificador.
          </p>
          <Link
            href="/staff/kids"
            className="mt-4 inline-flex items-center rounded-xl bg-[#3F362E] px-4 py-2.5 text-[14px] font-extrabold text-white"
          >
            Volver a Niños
          </Link>
        </div>
      ) : (
        <div>
          <KidProfileHeader
            backLabel="Volver a Niños"
            editLabel={kidProfilePageDataBase.editLabel}
            profile={profile}
          />
          <div className="mt-4.5 flex flex-col gap-6.5 lg:flex-row lg:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-4.5 lg:min-w-75">
              <KidAllergyNotice
                title={profile.allergyTitle ?? "Alergias y notas"}
                note={profile.allergyNote ?? "Sin novedad"}
              />
              <KidInfoCard profile={profile} />
            </div>
            <div className="flex w-full flex-none flex-col gap-3.5 lg:w-75">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[#3F362E] px-[13px] py-[13px] text-[15px] font-extrabold text-white"
              >
                <SunIcon className="shrink-0 text-white" />
                <span className="text-white">{kidProfilePageDataBase.daySummaryLabel}</span>
              </button>
              <KidParentsSection
                childId={profile.id}
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

export default function StaffKidProfilePage(props: KidProfilePageProps) {
  return (
    <Suspense fallback={null}>
      <StaffKidProfileContent {...props} />
    </Suspense>
  );
}
