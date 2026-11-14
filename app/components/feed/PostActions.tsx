import { CommentIcon } from "./icons/CommentIcon";
import { HeartIcon } from "./icons/HeartIcon";

type PostActionsProps = {
  reactions: number;
  comments: number;
};

export function PostActions({ reactions, comments }: PostActionsProps) {
  return (
    <div className="mt-4 flex items-center gap-[18px] border-t border-[#F0E6D8] pt-[14px]">
      <span className="flex items-center gap-[7px] text-[14px] font-bold text-[#E0654A]">
        <HeartIcon />
        {reactions}
      </span>
      <a
        href="#"
        className="flex items-center gap-[7px] text-[14px] font-bold text-[#94887B]"
      >
        <CommentIcon />
        {comments}
      </a>
      <span className="flex-1" />
      <a href="#" className="text-[14px] font-extrabold text-[#C5503A]">
        Editar
      </a>
    </div>
  );
}
