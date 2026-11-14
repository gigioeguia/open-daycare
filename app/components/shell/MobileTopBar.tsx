import { MenuIcon } from "./icons/MenuIcon";
import { SunIcon } from "./icons/SunIcon";

type MobileTopBarProps = {
  roomLabel: string;
  onMenuClick: () => void;
};

export function MobileTopBar({ roomLabel, onMenuClick }: MobileTopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-[#ECE0D0] bg-[#FFFDF9] px-4 py-3 lg:hidden">
      <div className="flex items-center gap-[10px]">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] text-white">
          <SunIcon className="h-[18px] w-[18px]" />
        </div>
        <div>
          <div className="font-[family-name:var(--font-fredoka)] text-[16px] font-semibold leading-none text-[#3F362E]">
            OpenDayCare
          </div>
          <div className="text-[11px] text-[#A89A8B]">{roomLabel}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F6ECDF] text-[#6E6359]"
      >
        <MenuIcon />
      </button>
    </header>
  );
}
