"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon } from "./icons/SearchIcon";

type KidsSearchInputProps = {
  placeholder: string;
  query: string;
};

export function KidsSearchInput({ placeholder, query }: KidsSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(query);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmedValue = value.trim();

      if (trimmedValue === query) {
        return;
      }

      const params = new URLSearchParams();

      if (trimmedValue) {
        params.set("q", trimmedValue);
      }

      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [value, query, pathname, router]);

  return (
    <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-[#ECE0D0] bg-[#FFFDF9] px-4 py-3">
      <SearchIcon />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 border-none bg-transparent text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]"
      />
    </div>
  );
}
