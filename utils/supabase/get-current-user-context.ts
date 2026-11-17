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

type ParentChildRoomRow = {
  child:
    | { room: { id: string; name: string } | { id: string; name: string }[] | null }
    | { room: { id: string; name: string } | { id: string; name: string }[] | null }[]
    | null;
};

function getDaycareName(
  daycare: { name: string } | { name: string }[] | null,
): string {
  if (!daycare) return "Guardería";
  return Array.isArray(daycare) ? daycare[0]?.name ?? "Guardería" : daycare.name;
}

function getRelationOne<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
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
  let currentRoomId: string | null = null;
  let currentRoomName: string | null = null;

  if (typedProfile.role === "parent") {
    const { data: links } = await supabase
      .from("parent_children")
      .select("child:children(room:rooms(id, name))")
      .eq("parent_id", typedProfile.id);

    const roomNames = new Set<string>();
    for (const row of (links ?? []) as unknown as ParentChildRoomRow[]) {
      const child = getRelationOne(row.child);
      const room = getRelationOne(child?.room ?? null);
      if (room?.name) {
        roomNames.add(room.name);
        if (!currentRoomName) {
          currentRoomName = room.name;
        }
      }
    }

    if (roomNames.size === 1) {
      // Keep room label; id not needed for parent feed filtering.
      currentRoomId = null;
    } else if (roomNames.size > 1) {
      currentRoomName = "Mis hijos";
      currentRoomId = null;
    } else {
      currentRoomName = null;
      currentRoomId = null;
    }
  } else {
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id, name")
      .eq("daycare_id", typedProfile.daycare_id)
      .order("name", { ascending: true });

    const roomRows = (rooms ?? []) as RoomRow[];
    const currentRoom = roomRows[0] ?? null;
    currentRoomId = currentRoom?.id ?? null;
    currentRoomName = currentRoom?.name ?? null;
  }

  return {
    userId: typedProfile.id,
    role: typedProfile.role,
    fullName: typedProfile.full_name ?? "Usuario",
    daycareId: typedProfile.daycare_id,
    daycareName: getDaycareName(typedProfile.daycare),
    currentRoomId,
    currentRoomName,
  };
}
