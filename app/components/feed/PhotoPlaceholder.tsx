import { ImageIcon } from "./icons/ImageIcon";

type PhotoPlaceholderProps = {
  label: string;
};

export function PhotoPlaceholder({ label }: PhotoPlaceholderProps) {
  return (
    <a
      href="#"
      className="mt-3.5 flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
    >
      <ImageIcon />
      <span className="text-[13.5px]">{label}</span>
    </a>
  );
}
