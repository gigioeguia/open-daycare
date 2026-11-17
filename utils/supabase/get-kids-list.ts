import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type KidListRow = {
  id: string;
  fullName: string;
  birthDate: string;
  roomName: string;
};

type KidListQueryRow = {
  id: string;
  full_name: string;
  birth_date: string;
  room:
    | { name: string }
    | { name: string }[]
    | null;
};

type ParentChildListRow = {
  child:
    | KidListQueryRow
    | KidListQueryRow[]
    | null;
};

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getRoomName(
  room: { name: string } | { name: string }[] | null,
): string | null {
  if (!room) {
    return null;
  }

  if (Array.isArray(room)) {
    return room[0]?.name ?? null;
  }

  return room.name;
}

function getRelationOne<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

async function getCurrentUserRoleAndId(
  supabase: ReturnType<typeof createClient>,
): Promise<{ userId: string; role: "admin" | "staff" | "parent" } | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile || !profile.role) {
    return null;
  }

  const role = profile.role as "admin" | "staff" | "parent";
  return { userId: profile.id as string, role };
}

export async function getKidsList(query?: string): Promise<KidListRow[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const current = await getCurrentUserRoleAndId(supabase);

  let rows: KidListQueryRow[] = [];

  if (current?.role === "parent") {
    const { data, error } = await supabase
      .from("parent_children")
      .select(
        "child:children(id, full_name, birth_date, room:rooms(name))",
      )
      .eq("parent_id", current.userId);

    if (error) {
      throw error;
    }

    rows = ((data ?? []) as unknown as ParentChildListRow[])
      .map((row) => getRelationOne(row.child))
      .filter((child): child is KidListQueryRow => Boolean(child));
  } else {
    const { data, error } = await supabase
      .from("children")
      .select("id, full_name, birth_date, room:rooms!inner(name)")
      .eq("status", "active")
      .not("room_id", "is", null)
      .order("full_name", { ascending: true });

    if (error) {
      throw error;
    }

    rows = (data ?? []) as KidListQueryRow[];
  }

  const normalizedQuery = normalizeSearchText(query?.trim() ?? "");
  const filteredRows =
    normalizedQuery.length === 0
      ? rows
      : rows.filter((row) =>
          normalizeSearchText(row.full_name).includes(normalizedQuery),
        );

  return filteredRows.flatMap((row) => {
    const roomName = getRoomName(row.room);

    if (!roomName) {
      return [];
    }

    return [
      {
        id: row.id,
        fullName: row.full_name,
        birthDate: row.birth_date,
        roomName,
      },
    ];
  });
}
