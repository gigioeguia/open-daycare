"use client";

import { CommentIcon } from "./icons/CommentIcon";
import { HeartIcon } from "./icons/HeartIcon";

type PostActionsProps = {
  reactions: number;
  comments: number;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
};

export function PostActions({
  reactions,
  comments,
  canManage = false,
  onEdit,
  onDelete,
  isDeleting = false,
}: PostActionsProps) {
  return (
    <div className="mt-4 flex items-center gap-4.5 border-t border-[#F0E6D8] pt-3.5">
      <span className="flex items-center gap-[7px] text-[14px] font-bold text-[#E0654A]">
        <HeartIcon />
        {reactions}
      </span>
      <span className="flex items-center gap-[7px] text-[14px] font-bold text-[#94887B]">
        <CommentIcon />
        {comments}
      </span>
      <span className="flex-1" />
      {canManage ? (
        <div className="flex items-center gap-3">
          <button type="button" onClick={onEdit} className="text-[14px] font-extrabold text-[#C5503A] hover:underline">
            Editar
          </button>
          <button type="button" onClick={onDelete} disabled={isDeleting} className="text-[14px] font-extrabold text-[#94887B] hover:text-[#D9684A] disabled:opacity-50">
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
