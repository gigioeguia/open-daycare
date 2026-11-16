"use client";

import { useState, useTransition } from "react";
import { deletePostAction } from "@/app/feed/actions";
import type { FeedPost } from "./feed-types";
import { PostActions } from "./PostActions";
import { PostHeader } from "./PostHeader";

type PostCardProps = {
  post: FeedPost;
  onEdit?: (post: FeedPost) => void;
};

export function PostCard({ post, onEdit }: PostCardProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!post.canManage) return;
    const confirmed = window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deletePostAction(post.id);
      if (!result.ok) {
        setError(result.message);
      }
    });
  };

  return (
    <article className="rounded-[20px] border border-[#ECE0D0] bg-[#FFFDF9] p-[20px_22px] shadow-[0_4px_16px_-12px_rgba(120,90,60,0.5)]">
      <PostHeader post={post} />
      <div className="mb-2.5 text-[12.5px] text-[#A89A8B]">{post.audienceLabel}</div>
      <p className="m-0 whitespace-pre-wrap text-[15.5px] leading-[1.55] text-[#4A4038]">{post.body}</p>

      {post.images.length > 0 ? (
        <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {post.images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-xl border border-[#ECE0D0] bg-[#F4ECE1]">
              {image.signedUrl ? (
                <img src={image.signedUrl} alt="Imagen de la publicación" className="h-32 w-full object-cover sm:h-36" loading="lazy" />
              ) : (
                <div className="flex h-32 items-center justify-center text-[13px] text-[#B0A290] sm:h-36">Imagen no disponible</div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="mt-3 text-[13px] font-semibold text-[#D9684A]">{error}</p> : null}

      <PostActions
        reactions={post.reactions}
        comments={post.comments}
        canManage={post.canManage}
        onEdit={() => onEdit?.(post)}
        onDelete={handleDelete}
        isDeleting={isPending}
      />
    </article>
  );
}
