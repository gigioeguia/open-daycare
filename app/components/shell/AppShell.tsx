"use client";

import { useState, type ReactNode } from "react";
import { CloseIcon } from "./icons/CloseIcon";
import { MobileTopBar } from "./MobileTopBar";
import { Sidebar, type ShellNavItem } from "./Sidebar";
import type { ShellUser } from "./UserBadge";

type AppShellProps = {
  roomLabel: string;
  brandHref?: string;
  newPostLabel?: string;
  newPostHref?: string;
  onNewPostClick?: () => void;
  navItems: ShellNavItem[];
  user: ShellUser;
  children: ReactNode;
  mainClassName?: string;
  contentClassName?: string;
};

export function AppShell({
  roomLabel,
  brandHref,
  newPostLabel,
  newPostHref,
  onNewPostClick,
  navItems,
  user,
  children,
  mainClassName = "",
  contentClassName = "",
}: AppShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar
        roomLabel={roomLabel}
        brandHref={brandHref}
        newPostLabel={newPostLabel}
        newPostHref={newPostHref}
        onNewPostClick={onNewPostClick}
        navItems={navItems}
        user={user}
        className="sticky top-0 hidden h-screen lg:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar roomLabel={roomLabel} onMenuClick={() => setIsDrawerOpen(true)} />

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
                roomLabel={roomLabel}
                brandHref={brandHref}
                newPostLabel={newPostLabel}
                newPostHref={newPostHref}
                onNewPostClick={onNewPostClick}
                navItems={navItems}
                user={user}
                className="h-auto min-h-0 flex-1 border-r-0"
              />
            </div>
          </div>
        ) : null}

        <main className={`min-w-0 flex-1 overflow-y-auto ${mainClassName}`}>
          <div className={contentClassName}>{children}</div>
        </main>
      </div>
    </div>
  );
}
