import type { Post } from "./feed-data";
import { PhotoPlaceholder } from "./PhotoPlaceholder";
import { PostActions } from "./PostActions";
import { PostHeader } from "./PostHeader";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-[20px] border border-[#ECE0D0] bg-[#FFFDF9] p-[20px_22px] shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <PostHeader post={post} />
      <div className="mb-[10px] text-[12.5px] text-[#A89A8B]">{post.audience}</div>
      <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">{post.content}</p>
      {post.photoPlaceholderLabel ? (
        <PhotoPlaceholder label={post.photoPlaceholderLabel} />
      ) : null}
      <PostActions reactions={post.reactions} comments={post.comments} />
    </article>
  );
}
