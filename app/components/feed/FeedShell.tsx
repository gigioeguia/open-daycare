"use client";

import { useState } from "react";
import type { FeedPageData } from "./feed-data";
import { CloseIcon } from "./icons/CloseIcon";
import { ComposerPrompt } from "./ComposerPrompt";
import { DaySection } from "./DaySection";
import { FeedHeader } from "./FeedHeader";
import { MobileTopBar } from "./MobileTopBar";
import { PostCard } from "./PostCard";
import { Sidebar } from "./Sidebar";

type FeedShellProps = {
  data: FeedPageData;
};

export function FeedShell({ data }: FeedShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar
        navItems={data.navItems}
        user={data.user}
        className="sticky top-0 hidden h-screen lg:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar onMenuClick={() => setIsDrawerOpen(true)} />

        {isDrawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-[#3F362E]/30"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-[248px] max-w-[85vw] flex-col bg-[#FFFDF9] shadow-xl">
              <div className="flex justify-end border-b border-[#ECE0D0] p-3">
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F6ECDF] text-[#6E6359]"
                >
                  <CloseIcon />
                </button>
              </div>
              <Sidebar
                navItems={data.navItems}
                user={data.user}
                className="h-auto min-h-0 flex-1 border-r-0"
              />
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[760px] px-5 py-8 sm:px-8 lg:px-10 lg:py-[34px] lg:pb-20">
            <FeedHeader
              orgLabel={data.orgLabel}
              greeting={data.greeting}
              meta={data.meta}
            />
            <ComposerPrompt userInitial={data.user.initial} prompt={data.composerPrompt} />
            <DaySection label={data.dayLabel} />
            <div className="flex flex-col gap-4">
              {data.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
