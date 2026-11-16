import { PlusIcon } from "./icons/PlusIcon";
import { LinkedParentItem } from "./LinkedParentItem";
import type { LinkedParent } from "./kids-data";

type KidParentsCardProps = {
  sectionLabel: string;
  linkAnotherParentLabel: string;
  parents: LinkedParent[];
  onLinkAnotherParent: () => void;
};

export function KidParentsCard({
  sectionLabel,
  linkAnotherParentLabel,
  parents,
  onLinkAnotherParent,
}: KidParentsCardProps) {
  const hasLinkedParents = parents.length > 0;

  return (
    <div className="rounded-2xl border border-[#ECE0D0] bg-[#FFFDF9] p-[16px_18px]">
      <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D]">
        {sectionLabel}
      </div>
      <div className="flex flex-col gap-3.5">
        {hasLinkedParents ? (
          parents.map((parent) => (
            <LinkedParentItem key={parent.id} parent={parent} />
          ))
        ) : (
          <p className="m-0 text-[14.5px] text-[#94887B]">
            Sin padres vinculados.
          </p>
        )}
        <button
          type="button"
          onClick={onLinkAnotherParent}
          className="flex items-center gap-3 pt-2 text-left"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
            <PlusIcon size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[14.5px] font-extrabold text-[#C5503A]">
            {linkAnotherParentLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
