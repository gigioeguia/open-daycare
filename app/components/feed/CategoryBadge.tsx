import type { FeedPostTypeId } from "./feed-types";

type CategoryBadgeProps = {
  type: FeedPostTypeId;
};

const CATEGORY_STYLES: Record<
  FeedPostTypeId,
  { label: string; background: string; dot: string; text: string }
> = {
  meal: { label: "COMIDA", background: "#F6E6B8", dot: "#9A7B1E", text: "#9A7B1E" },
  nap: { label: "SIESTA", background: "#E7DCF6", dot: "#7B5FC0", text: "#7B5FC0" },
  activity: { label: "ACTIVIDAD", background: "#C7E7F1", dot: "#2E89A6", text: "#2E89A6" },
  achievement: { label: "LOGRO", background: "#CFEBD8", dot: "#3E9B6C", text: "#3E9B6C" },
  mood: { label: "ÁNIMO", background: "#F9D2DE", dot: "#C56486", text: "#C56486" },
  photo: { label: "FOTO", background: "#FBD8CC", dot: "#D9684A", text: "#D9684A" },
  announcement: { label: "ANUNCIO", background: "#CCD8F4", dot: "#4E72C8", text: "#4E72C8" },
};

export function CategoryBadge({ type }: CategoryBadgeProps) {
  const style = CATEGORY_STYLES[type];

  return (
    <div className="flex items-center gap-[7px] rounded-full px-3 py-[6px]" style={{ backgroundColor: style.background }}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.dot }} />
      <span className="text-[12px] font-extrabold tracking-[0.5px]" style={{ color: style.text }}>
        {style.label}
      </span>
    </div>
  );
}
