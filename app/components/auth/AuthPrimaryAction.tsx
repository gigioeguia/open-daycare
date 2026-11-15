import Link from "next/link";

type AuthPrimaryActionProps = {
  href: string;
  label: string;
};

export function AuthPrimaryAction({ href, label }: AuthPrimaryActionProps) {
  return (
    <Link
      href={href}
      className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
    >
      {label}
    </Link>
  );
}
