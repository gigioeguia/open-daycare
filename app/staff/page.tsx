import { Suspense } from "react";
import { connection } from "next/server";
import { FeedShell } from "@/app/components/feed/FeedShell";
import type { FeedPageViewData } from "@/app/components/feed/feed-types";
import { getCurrentUserContext } from "@/utils/supabase/get-current-user-context";
import {
  getDaycareChildrenOptions,
  getFeedPostsForContext,
} from "@/utils/supabase/feed";

const navItems: FeedPageViewData["navItems"] = [
  { id: "feed", label: "Feed", active: true },
  { id: "children", label: "Niños", active: false },
  { id: "notices", label: "Avisos", active: false },
  { id: "account", label: "Mi cuenta", active: false },
];

function getRoleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Administradora";
    case "staff":
      return "Personal";
    case "parent":
      return "Familiar";
    default:
      return role;
  }
}

function getGreetingName(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0];
  return firstName || fullName || "Usuario";
}

function getInitial(name: string): string {
  return (name.trim().charAt(0) || "U").toUpperCase();
}

function buildFeedMeta(
  role: string,
  roomName: string | null,
  postCount: number,
): string {
  if (role === "parent") {
    return `${postCount} ${postCount === 1 ? "publicación" : "publicaciones"} para tu familia`;
  }
  const roomLabel = roomName ? ` · ${roomName}` : "";
  return `${postCount} ${postCount === 1 ? "publicación" : "publicaciones"}${roomLabel}`;
}

async function StaffFeedContent() {
  await connection();
  const context = await getCurrentUserContext();

  if (!context || context.role === "parent") {
    return null;
  }

  let posts: Awaited<ReturnType<typeof getFeedPostsForContext>> = [];
  let childrenOptions: Awaited<ReturnType<typeof getDaycareChildrenOptions>> = [];
  let loadError = false;

  try {
    [posts, childrenOptions] = await Promise.all([
      getFeedPostsForContext(context),
      context.role === "staff" || context.role === "admin"
        ? getDaycareChildrenOptions(context.daycareId)
        : Promise.resolve([]),
    ]);
  } catch {
    loadError = true;
  }

  const roomLabel = context.currentRoomName ?? "Sala";
  const orgLabel = `${context.daycareName.toUpperCase()} · ${roomLabel.toUpperCase()}`;
  const data: FeedPageViewData = {
    orgLabel,
    greeting: `Buenas, ${getGreetingName(context.fullName)}`,
    meta: loadError
      ? "No pudimos cargar las publicaciones"
      : buildFeedMeta(context.role, context.currentRoomName, posts.length),
    dayLabel: "PUBLICACIONES",
    composerPrompt: "Compartí un momento…",
    user: {
      name: context.fullName,
      role: `${getRoleLabel(context.role)} · ${roomLabel}`,
      initial: getInitial(context.fullName),
      avatarBackgroundColor: "#F2937A",
      avatarColor: "#FFFFFF",
    },
    navItems,
    posts,
    currentRoomId: context.currentRoomId,
    currentRoomName: context.currentRoomName,
    canCreatePost: context.role === "staff" || context.role === "admin",
    area: "staff",
  };

  return <FeedShell data={data} childrenOptions={childrenOptions} />;
}

export default function StaffFeedPage() {
  return (
    <Suspense fallback={null}>
      <StaffFeedContent />
    </Suspense>
  );
}
