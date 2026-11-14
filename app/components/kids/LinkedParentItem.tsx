import { Avatar } from "../shell/Avatar";
import type { LinkedParent } from "./kids-data";

type LinkedParentItemProps = {
  parent: LinkedParent;
};

export function LinkedParentItem({ parent }: LinkedParentItemProps) {
  const isActive = parent.status === "active";
  return (
    <div className="flex items-center gap-3">
      <Avatar
        initial={parent.initial}
        size={40}
        backgroundColor={parent.avatarBackground}
        color="#FFFFFF"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-extrabold text-[#3F362E]">{parent.name}</div>
        <div className="text-[12.5px] text-[#A89A8B]">{parent.relationLabel}</div>
      </div>
      <span
        className={`flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold ${
          isActive ? "bg-[#CFEBD8] text-[#3E9B6C]" : "bg-[#F7E7A6] text-[#9A7B1E]"
        }`}
      >
        {parent.statusLabel}
      </span>
    </div>
  );
}
