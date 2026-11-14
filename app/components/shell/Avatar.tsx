type AvatarProps = {
  initial: string;
  size?: number;
  backgroundColor: string;
  color: string;
  className?: string;
};

export function Avatar({
  initial,
  size = 44,
  backgroundColor,
  color,
  className = "",
}: AvatarProps) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full font-[family-name:var(--font-fredoka)] font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor,
        color,
        fontSize: size >= 44 ? 17 : 16,
      }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
