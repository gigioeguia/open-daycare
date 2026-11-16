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

export async function getKidsList(query?: string): Promise<KidListRow[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("children")
    .select("id, full_name, birth_date, room:rooms!inner(name)")
    .eq("status", "active")
    .not("room_id", "is", null)
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as KidListQueryRow[];
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
