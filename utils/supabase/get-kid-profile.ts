import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type KidProfileChildRecord = {
  id: string;
  fullName: string;
  birthDate: string;
  enrolledAt: string;
  medicalNotes: string | null;
  allergyTags: string[] | null;
  roomName: string | null;
};

export type KidLinkedParentRecord = {
  id: string;
  fullName: string;
  relationship: "father" | "mother" | "guardian";
};

export type KidProfileRecord = {
  child: KidProfileChildRecord;
  linkedParents: KidLinkedParentRecord[];
};

type KidProfileChildQueryRow = {
  id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string;
  medical_notes: string | null;
  allergy_tags: string[] | null;
  room: { name: string } | { name: string }[] | null;
};

type KidLinkedParentQueryRow = {
  id: string;
  relationship: "father" | "mother" | "guardian";
  parent:
    | { full_name: string }
    | { full_name: string }[]
    | null;
};

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

function getParentFullName(
  parent: { full_name: string } | { full_name: string }[] | null,
): string | null {
  if (!parent) {
    return null;
  }

  if (Array.isArray(parent)) {
    return parent[0]?.full_name ?? null;
  }

  return parent.full_name;
}

export async function getKidProfileChildById(
  childId: string,
): Promise<KidProfileChildRecord | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("children")
    .select(
      "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, room:rooms(name)",
    )
    .eq("id", childId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const row = data as KidProfileChildQueryRow;

  return {
    id: row.id,
    fullName: row.full_name,
    birthDate: row.birth_date,
    enrolledAt: row.enrolled_at,
    medicalNotes: row.medical_notes,
    allergyTags: row.allergy_tags,
    roomName: getRoomName(row.room),
  };
}

export async function getKidLinkedParents(
  childId: string,
): Promise<KidLinkedParentRecord[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("parent_children")
    .select("id, relationship, parent:users(full_name)")
    .eq("child_id", childId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as KidLinkedParentQueryRow[];

  return rows.flatMap((row) => {
    const fullName = getParentFullName(row.parent);

    if (!fullName) {
      return [];
    }

    return [
      {
        id: row.id,
        fullName,
        relationship: row.relationship,
      },
    ];
  });
}

export async function getKidProfileById(
  childId: string,
): Promise<KidProfileRecord | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let role: "admin" | "staff" | "parent" | null = null;
  if (authUser) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .maybeSingle();
    role = (profile?.role as "admin" | "staff" | "parent" | null) ?? null;
  }

  if (role === "parent" && authUser) {
    const { data: link } = await supabase
      .from("parent_children")
      .select("id")
      .eq("parent_id", authUser.id)
      .eq("child_id", childId)
      .maybeSingle();

    if (!link) {
      return null;
    }
  }

  const child = await getKidProfileChildById(childId);

  if (!child) {
    return null;
  }

  const linkedParents = await getKidLinkedParents(childId);

  return {
    child,
    linkedParents,
  };
}
