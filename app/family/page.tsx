import { Suspense } from "react";
import { connection } from "next/server";
import { FeedShell } from "@/app/components/feed/FeedShell";
import type { FeedPageViewData } from "@/app/components/feed/feed-types";
import { getCurrentUserContext } from "@/utils/supabase/get-current-user-context";
import { getFeedPostsForContext } from "@/utils/supabase/feed";

const navItems: FeedPageViewData["navItems"] = [
  { id: "feed", label: "Feed", active: true },
  { id: "children", label: "Mis hijos", active: false },
  { id: "notices", label: "Avisos", active: false },
  { id: "account", label: "Mi cuenta", active: false },
];

function getGreetingName(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0];
  return firstName || fullName || "Usuario";
}

function getInitial(name: string): string {
  return (name.trim().charAt(0) || "U").toUpperCase();
}

async function FamilyFeedContent() {
  await connection();
  const context = await getCurrentUserContext();

  if (!context || context.role !== "parent") {
    return null;
  }

  let posts: Awaited<ReturnType<typeof getFeedPostsForContext>> = [];
  let loadError = false;

  try {
    posts = await getFeedPostsForContext(context);
  } catch {
    loadError = true;
  }

  const roomLabel = context.currentRoomName ?? "Familia";
  const orgLabel = `${context.daycareName.toUpperCase()} · ${roomLabel.toUpperCase()}`;
  const data: FeedPageViewData = {
    orgLabel,
    greeting: `Buenas, ${getGreetingName(context.fullName)}`,
    meta: loadError
      ? "No pudimos cargar las publicaciones"
      : `${posts.length} ${posts.length === 1 ? "publicación" : "publicaciones"} para tu familia`,
    dayLabel: "PUBLICACIONES",
    composerPrompt: "Compartí un momento…",
    user: {
      name: context.fullName,
      role: `Familiar · ${roomLabel}`,
      initial: getInitial(context.fullName),
      avatarBackgroundColor: "#F2937A",
      avatarColor: "#FFFFFF",
    },
    navItems,
    posts,
    currentRoomId: null,
    currentRoomName: context.currentRoomName,
    canCreatePost: false,
    area: "family",
  };

  return <FeedShell data={data} childrenOptions={[]} />;
}

export default function FamilyFeedPage() {
  return (
    <Suspense fallback={null}>
      <FamilyFeedContent />
    </Suspense>
  );
}
