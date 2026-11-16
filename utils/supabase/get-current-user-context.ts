import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type AppUserRole = "admin" | "staff" | "parent";

export type CurrentUserContext = {
  userId: string;
  role: AppUserRole;
  fullName: string;
  daycareId: string;
  daycareName: string;
  currentRoomId: string | null;
  currentRoomName: string | null;
};

type RoomRow = { id: string; name: string };

type UserProfileRow = {
  id: string;
  role: AppUserRole;
  full_name: string;
  daycare_id: string;
  daycare:
    | { name: string }
    | { name: string }[]
    | null;
};

function getDaycareName(
  daycare: { name: string } | { name: string }[] | null,
): string {
  if (!daycare) return "Guardería";
  return Array.isArray(daycare) ? daycare[0]?.name ?? "Guardería" : daycare.name;
}

export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role, full_name, daycare_id, daycare:daycares(name)")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const typedProfile = profile as UserProfileRow;

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("daycare_id", typedProfile.daycare_id)
    .order("name", { ascending: true });

  const roomRows = (rooms ?? []) as RoomRow[];
  const currentRoom = roomRows[0] ?? null;

  return {
    userId: typedProfile.id,
    role: typedProfile.role,
    fullName: typedProfile.full_name ?? "Usuario",
    daycareId: typedProfile.daycare_id,
    daycareName: getDaycareName(typedProfile.daycare),
    currentRoomId: currentRoom?.id ?? null,
    currentRoomName: currentRoom?.name ?? null,
  };
}
