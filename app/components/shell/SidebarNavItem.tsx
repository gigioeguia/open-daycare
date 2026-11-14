import Link from "next/link";
import type { ReactNode } from "react";

type SidebarNavItemProps = {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
};

export function SidebarNavItem({
  href,
  icon,
  label,
  active = false,
}: SidebarNavItemProps) {
  const isExternal = href === "#";
  const base = `flex items-center gap-3 rounded-[12px] px-3 py-[11px] text-[14.5px] ${
    active
      ? "bg-[#FBE3D8] font-extrabold text-[#D9583C]"
      : "bg-transparent font-semibold text-[#6E6359]"
  }`;

  if (isExternal) {
    return (
      <a href={href} className={base}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={base}>
      {icon}
      {label}
    </Link>
  );
}
