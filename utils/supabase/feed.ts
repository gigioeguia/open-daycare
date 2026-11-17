import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createSignedPostImageUrls } from "@/utils/supabase/post-images";
import type { AppUserRole, CurrentUserContext } from "@/utils/supabase/get-current-user-context";
import type { AudienceChildOption, FeedPost, FeedPostTypeId } from "@/app/components/feed/feed-types";

type PostRow = {
  id: string;
  author_id: string;
  room_id: string;
  type: FeedPostTypeId;
  body: string;
  published_at: string;
  author:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
  room:
    | { name: string | null }
    | { name: string | null }[]
    | null;
  post_children: Array<{
    child:
      | { id: string; full_name: string | null }
      | { id: string; full_name: string | null }[]
      | null;
  }> | null;
  post_photos: Array<{
    id: string;
    storage_path: string;
    position: number;
  }> | null;
};

function getRelationOne<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  return (trimmed.charAt(0) || "?").toUpperCase();
}

function formatTimeLabel(publishedAt: string): string {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatAudienceLabel(post: PostRow): string {
  if (post.type === "announcement") {
    const roomName = getRelationOne(post.room)?.name ?? "la sala";
    return `Para: toda la sala (${roomName})`;
  }

  const childNames = (post.post_children ?? [])
    .map((row) => getRelationOne(row.child)?.full_name?.trim() ?? "")
    .filter(Boolean);

  if (childNames.length === 0) {
    return "Para: toda la sala";
  }
  if (childNames.length === 1) {
    return `Para: familia de ${childNames[0]}`;
  }
  return `Para: familias de ${childNames.join(", ")}`;
}

export async function getFeedPostsForContext(
  context: CurrentUserContext,
): Promise<FeedPost[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase
    .from("posts")
    .select(
      "id, author_id, room_id, type, body, published_at, author:users!posts_author_id_fkey(full_name), room:rooms(name), post_children(child:children(id, full_name)), post_photos(id, storage_path, position)",
    )
    .eq("daycare_id", context.daycareId)
    .order("published_at", { ascending: false });

  if (context.role === "staff" || context.role === "admin") {
    if (!context.currentRoomId) {
      return [];
    }
    query = query.eq("room_id", context.currentRoomId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  let rows = (data ?? []) as unknown as PostRow[];

  if (context.role === "parent") {
    const { data: links, error: linksError } = await supabase
      .from("parent_children")
      .select("child_id, child:children(room_id)")
      .eq("parent_id", context.userId);

    if (linksError) {
      throw linksError;
    }

    type LinkRow = {
      child_id: string;
      child:
        | { room_id: string | null }
        | { room_id: string | null }[]
        | null;
    };

    const linkedChildIds = new Set<string>();
    const linkedRoomIds = new Set<string>();

    for (const link of (links ?? []) as unknown as LinkRow[]) {
      if (link.child_id) {
        linkedChildIds.add(link.child_id);
      }
      const child = getRelationOne(link.child);
      if (child?.room_id) {
        linkedRoomIds.add(child.room_id);
      }
    }

    rows = rows.filter((post) => {
      const taggedChildIds = (post.post_children ?? [])
        .map((row) => getRelationOne(row.child)?.id?.trim() ?? "")
        .filter(Boolean);
      const hasLinkedChild = taggedChildIds.some((id) => linkedChildIds.has(id));
      if (hasLinkedChild) {
        return true;
      }

      if (post.type === "announcement" && linkedRoomIds.has(post.room_id)) {
        return true;
      }

      // Posts with no tagged children are treated as room-wide; show if in linked rooms.
      if (taggedChildIds.length === 0 && linkedRoomIds.has(post.room_id)) {
        return true;
      }

      return false;
    });
  }

  const allStoragePaths = rows.flatMap((post) =>
    (post.post_photos ?? []).map((photo) => photo.storage_path),
  );
  const signedUrls = await createSignedPostImageUrls(supabase, allStoragePaths);

  return rows.map((post) => {
    const authorName = getRelationOne(post.author)?.full_name?.trim() || "Equipo";
    const photos = [...(post.post_photos ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((photo) => ({
        id: photo.id,
        storagePath: photo.storage_path,
        signedUrl: signedUrls.get(photo.storage_path) ?? null,
        position: photo.position,
      }));

    const canManage = context.role === "staff" || context.role === "admin";
    const taggedChildIds = (post.post_children ?? [])
      .map((row) => getRelationOne(row.child)?.id?.trim() ?? "")
      .filter(Boolean);
    const audienceMode: "children" | "room" =
      post.type === "announcement" || taggedChildIds.length === 0 ? "room" : "children";

    return {
      id: post.id,
      type: post.type,
      authorId: post.author_id,
      authorName,
      authorInitial: getInitial(authorName),
      timeLabel: formatTimeLabel(post.published_at),
      publishedByLabel:
        post.author_id === context.userId
          ? "publicado por vos"
          : `publicado por ${authorName}`,
      audienceLabel: formatAudienceLabel(post),
      audienceMode,
      childIds: audienceMode === "children" ? taggedChildIds : [],
      body: post.body,
      images: photos,
      reactions: 0,
      comments: 0,
      canManage,
    };
  });
}

export async function getDaycareChildrenOptions(
  daycareId: string,
): Promise<AudienceChildOption[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("children")
    .select("id, full_name, room:rooms!inner(name, daycare_id)")
    .eq("status", "active")
    .not("room_id", "is", null)
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  type ChildRow = {
    id: string;
    full_name: string;
    room:
      | { name: string; daycare_id: string }
      | { name: string; daycare_id: string }[]
      | null;
  };

  const palette = [
    { bg: "#A9D9E8", color: "#1F7A93" },
    { bg: "#F4B8CC", color: "#C44A7A" },
    { bg: "#B9DEC4", color: "#3E8B62" },
    { bg: "#FBD8CC", color: "#D9684A" },
    { bg: "#CCD8F4", color: "#4E72C8" },
    { bg: "#F9D2DE", color: "#C56486" },
  ];

  return ((data ?? []) as unknown as ChildRow[])
    .flatMap((row) => {
      const room = getRelationOne(row.room);
      if (!room || room.daycare_id !== daycareId) return [];
      const name = row.full_name?.trim() || "Niño/a";
      const index = Math.abs(hashString(name)) % palette.length;
      return [
        {
          id: row.id,
          label: name,
          initial: getInitial(name),
          roomName: room.name,
          avatarBackgroundColor: palette[index].bg,
          avatarColor: palette[index].color,
        },
      ];
    });
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}

export function canManagePosts(role: AppUserRole): boolean {
  return role === "staff" || role === "admin";
}
