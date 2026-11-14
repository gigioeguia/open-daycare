import { PlusIcon } from "./icons/PlusIcon";
import { LinkedParentItem } from "./LinkedParentItem";
import type { LinkedParent } from "./kids-data";

type KidParentsCardProps = {
  sectionLabel: string;
  linkAnotherParentLabel: string;
  parents: LinkedParent[];
};

export function KidParentsCard({
  sectionLabel,
  linkAnotherParentLabel,
  parents,
}: KidParentsCardProps) {
  return (
    <div className="rounded-[16px] border border-[#ECE0D0] bg-[#FFFDF9] p-[16px_18px]">
      <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
        {sectionLabel}
      </div>
      <div className="flex flex-col gap-[14px]">
        {parents.map((parent) => (
          <LinkedParentItem key={parent.id} parent={parent} />
        ))}
        <a href="#" className="flex items-center gap-3 pt-2">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
            <PlusIcon size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[14.5px] font-extrabold text-[#C5503A]">
            {linkAnotherParentLabel}
          </span>
        </a>
      </div>
    </div>
  );
}
