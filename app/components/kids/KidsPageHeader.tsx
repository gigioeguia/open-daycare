"use client";

import { useState } from "react";
import { AddChildModal } from "./AddChildModal";
import { PlusIcon } from "./icons/PlusIcon";

type KidsPageHeaderProps = {
  sectionLabel: string;
  title: string;
  addChildLabel: string;
};

export function KidsPageHeader({
  sectionLabel,
  title,
  addChildLabel,
}: KidsPageHeaderProps) {
  const [isAddChildModalOpen, setIsAddChildModalOpen] = useState(false);

  return (
    <>
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C]">
            {sectionLabel}
          </div>
          <h1 className="m-0 font-[family-name:var(--font-fredoka)] text-[30px] font-semibold text-[#3F362E]">
            {title}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsAddChildModalOpen(true)}
          className="flex items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
        >
          <PlusIcon />
          {addChildLabel}
        </button>
      </div>
      <AddChildModal
        open={isAddChildModalOpen}
        onClose={() => setIsAddChildModalOpen(false)}
      />
    </>
  );
}
