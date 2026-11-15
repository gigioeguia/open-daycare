import type { Post } from "./feed-data";
import { Avatar } from "./Avatar";
import { CategoryBadge } from "./CategoryBadge";
import { MegaphoneIcon } from "./icons/MegaphoneIcon";

type PostHeaderProps = {
  post: Post;
};

export function PostHeader({ post }: PostHeaderProps) {
  const isAnnouncement = post.category === "announcement";

  return (
    <div className="mb-3.5 flex items-center gap-3">
      {isAnnouncement ? (
        <div className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-[#CCD8F4] text-[#4E72C8]">
          <MegaphoneIcon />
        </div>
      ) : (
        <Avatar
          initial={post.authorInitial ?? "?"}
          size={44}
          backgroundColor="#A9D9E8"
          color="#1F7A93"
        />
      )}
      <div className="flex-1">
        <div className="font-(family-name:--font-fredoka) text-[16.5px] font-semibold text-[#3F362E]">
          {post.authorName}
        </div>
        <div className="text-[12.5px] text-[#A89A8B]">
          {post.time} · {post.publishedBy}
        </div>
      </div>
      <CategoryBadge category={post.category} />
    </div>
  );
}
