"use client";

import { useState } from "react";
import type { FeedPageData, NavItem } from "./feed-data";
import { ComposerPrompt } from "./ComposerPrompt";
import { CreatePostModal } from "./CreatePostModal";
import { DaySection } from "./DaySection";
import { FeedHeader } from "./FeedHeader";
import { PostCard } from "./PostCard";
import { AppShell } from "../shell/AppShell";
import type { ShellNavItem } from "../shell/Sidebar";
import { BellIcon } from "../shell/icons/BellIcon";
import { ChildrenIcon } from "../shell/icons/ChildrenIcon";
import { HomeIcon } from "../shell/icons/HomeIcon";
import { UserIcon } from "../shell/icons/UserIcon";

type FeedShellProps = {
  data: FeedPageData;
};

function getFeedNavIcon(id: NavItem["id"]) {
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

function getFeedNavHref(id: NavItem["id"]) {
  switch (id) {
    case "feed":
      return "/";
    case "children":
      return "/kids";
    case "notices":
      return "#";
    case "account":
      return "#";
  }
}

export function FeedShell({ data }: FeedShellProps) {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const navItems: ShellNavItem[] = data.navItems.map((item) => ({
    id: item.id,
    label: item.label,
    href: getFeedNavHref(item.id),
    active: item.active,
    icon: getFeedNavIcon(item.id),
  }));

  return (
    <AppShell
      roomLabel="Sala Lunas"
      brandHref="/"
      navItems={navItems}
      onNewPostClick={() => setIsCreatePostModalOpen(true)}
      user={{
        name: data.user.name,
        role: data.user.role,
        initial: data.user.initial,
        avatarBackgroundColor: "#F2937A",
        avatarColor: "#FFFFFF",
      }}
      contentClassName="mx-auto w-full max-w-[760px] px-5 py-8 sm:px-8 lg:px-10 lg:py-[34px] lg:pb-20"
    >
      <FeedHeader
        orgLabel={data.orgLabel}
        greeting={data.greeting}
        meta={data.meta}
      />
      <ComposerPrompt
        userInitial={data.user.initial}
        prompt={data.composerPrompt}
      />
      <DaySection label={data.dayLabel} />
      <div className="flex flex-col gap-4">
        {data.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
      <CreatePostModal
        open={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
      />
    </AppShell>
  );
}
