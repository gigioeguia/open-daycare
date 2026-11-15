import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

type UserRole = "admin" | "staff" | "parent";

const roleLabels: Record<UserRole, string> = {
  admin: "Administradora",
  staff: "Personal",
  parent: "Familiar",
};

export type CurrentUserProfile = {
  name: string;
  role: string;
  initial: string;
  avatarBackgroundColor: string;
  avatarColor: string;
};

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role, daycare:daycares(name)")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const daycareRelation = profile.daycare as
    | { name: string }
    | { name: string }[]
    | null;

  const daycareName = Array.isArray(daycareRelation)
    ? daycareRelation[0]?.name
    : daycareRelation?.name;

  const roleKey = profile.role as UserRole;
  const roleLabel = roleLabels[roleKey] ?? profile.role;
  const name = profile.full_name ?? "Usuario";
  const initial = (name.trim().charAt(0) || "U").toUpperCase();

  return {
    name,
    role: `${roleLabel} · ${daycareName ?? "Guardería"}`,
    initial,
    avatarBackgroundColor: "#F2937A",
    avatarColor: "#FFFFFF",
  };
}
