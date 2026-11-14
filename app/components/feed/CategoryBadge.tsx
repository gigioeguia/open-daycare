import type { PostCategory } from "./feed-data";

type CategoryBadgeProps = {
  category: PostCategory;
};

const CATEGORY_STYLES: Record<
  PostCategory,
  { label: string; background: string; dot: string; text: string }
> = {
  achievement: {
    label: "LOGRO",
    background: "#CFEBD8",
    dot: "#3E9B6C",
    text: "#3E9B6C",
  },
  activity: {
    label: "ACTIVIDAD",
    background: "#C7E7F1",
    dot: "#2E89A6",
    text: "#2E89A6",
  },
  announcement: {
    label: "ANUNCIO",
    background: "#CCD8F4",
    dot: "#4E72C8",
    text: "#4E72C8",
  },
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const style = CATEGORY_STYLES[category];

  return (
    <div
      className="flex items-center gap-[7px] rounded-full px-3 py-[6px]"
      style={{ backgroundColor: style.background }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: style.dot }}
      />
      <span
        className="text-[12px] font-extrabold tracking-[0.5px]"
        style={{ color: style.text }}
      >
        {style.label}
      </span>
    </div>
  );
}
