import Link from "next/link";

type AuthPrimaryActionProps = {
  label: string;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

const actionClassName =
  "block w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] disabled:cursor-not-allowed disabled:opacity-70";

export function AuthPrimaryAction({
  label,
  href,
  type = "button",
  disabled = false,
}: AuthPrimaryActionProps) {
  if (href) {
    return (
      <Link href={href} className={actionClassName}>
        {label}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={actionClassName}>
      {label}
    </button>
  );
}
