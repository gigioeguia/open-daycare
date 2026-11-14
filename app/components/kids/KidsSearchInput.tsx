import { SearchIcon } from "./icons/SearchIcon";

type KidsSearchInputProps = {
  placeholder: string;
};

export function KidsSearchInput({ placeholder }: KidsSearchInputProps) {
  return (
    <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-[#ECE0D0] bg-[#FFFDF9] px-4 py-3">
      <SearchIcon />
      <input
        placeholder={placeholder}
        readOnly
        className="flex-1 border-none bg-transparent text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]"
      />
    </div>
  );
}
