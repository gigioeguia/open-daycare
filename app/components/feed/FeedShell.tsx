"use client";

import { useMemo, useState } from "react";
import { ComposerPrompt } from "./ComposerPrompt";
import { CreatePostModal } from "./CreatePostModal";
import { DaySection } from "./DaySection";
import { FeedHeader } from "./FeedHeader";
import { PostCard } from "./PostCard";
import type { AudienceChildOption, FeedPageViewData, FeedPost } from "./feed-types";
import { AppShell } from "../shell/AppShell";
import type { ShellNavItem } from "../shell/Sidebar";
import type { ShellUser } from "../shell/UserBadge";
import { BellIcon } from "../shell/icons/BellIcon";
import { ChildrenIcon } from "../shell/icons/ChildrenIcon";
import { HomeIcon } from "../shell/icons/HomeIcon";
import { UserIcon } from "../shell/icons/UserIcon";

type FeedShellProps = {
  data: FeedPageViewData;
  childrenOptions: AudienceChildOption[];
};

function getFeedNavIcon(id: FeedPageViewData["navItems"][number]["id"]) {
  switch (id) {
    case "feed":
      return <HomeIcon />;
    case "children":
      return <ChildrenIcon />;
    case "notices":
      return <BellIcon />;
    case "account":
      return <UserIcon />;
  }
}

function getFeedNavHref(
  id: FeedPageViewData["navItems"][number]["id"],
  area: "staff" | "family",
) {
  if (area === "family") {
    switch (id) {
      case "feed":
        return "/family";
      case "children":
        return "/family/kids";
      case "notices":
        return "#";
      case "account":
        return "#";
    }
  }

  switch (id) {
    case "feed":
      return "/staff";
    case "children":
      return "/staff/kids";
    case "notices":
      return "#";
    case "account":
      return "#";
  }
}

export function FeedShell({ data, childrenOptions }: FeedShellProps) {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const area = data.area ?? "staff";

  const navItems: ShellNavItem[] = useMemo(
    () =>
      data.navItems.map((item) => ({
        id: item.id,
        label: item.label,
        href: getFeedNavHref(item.id, area),
        active: item.active,
        icon: getFeedNavIcon(item.id),
      })),
    [area, data.navItems],
  );

  const shellUser: ShellUser = {
    name: data.user.name,
    role: data.user.role,
    initial: data.user.initial,
    avatarBackgroundColor: data.user.avatarBackgroundColor ?? "#F2937A",
    avatarColor: data.user.avatarColor ?? "#FFFFFF",
  };

  const roomLabel = data.currentRoomName ?? "Sala";
  const canCreatePost = data.canCreatePost;

  return (
    <AppShell
      roomLabel={roomLabel}
      brandHref={area === "family" ? "/family" : "/staff"}
      navItems={navItems}
      onNewPostClick={canCreatePost ? () => setIsCreatePostModalOpen(true) : undefined}
      showNewPost={area === "staff"}
      user={shellUser}
      contentClassName="mx-auto w-full max-w-[760px] px-5 py-8 sm:px-8 lg:px-10 lg:py-[34px] lg:pb-20"
    >
      <FeedHeader
        orgLabel={data.orgLabel}
        greeting={data.greeting}
        meta={data.meta}
      />
      <ComposerPrompt userInitial={data.user.initial} prompt={data.composerPrompt} />
      <DaySection label={data.dayLabel} />

      {data.posts.length === 0 ? (
        <div className="rounded-[20px] border border-[#ECE0D0] bg-[#FFFDF9] p-6 text-[15px] text-[#94887B]">
          No hay publicaciones para mostrar.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={post.canManage ? (selectedPost) => setEditingPost(selectedPost) : undefined}
            />
          ))}
        </div>
      )}

      {canCreatePost && isCreatePostModalOpen ? (
        <CreatePostModal
          key="create-post-modal"
          open={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          childrenOptions={childrenOptions}
          currentRoomName={data.currentRoomName}
          mode="create"
        />
      ) : null}

      {editingPost ? (
        <CreatePostModal
          key={`edit-post-modal-${editingPost.id}`}
          open={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          childrenOptions={childrenOptions}
          currentRoomName={data.currentRoomName}
          mode="edit"
          post={editingPost}
        />
      ) : null}
    </AppShell>
  );
}
