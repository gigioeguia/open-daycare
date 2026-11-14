import { Avatar } from "./Avatar";
import { CameraIcon } from "./icons/CameraIcon";

type ComposerPromptProps = {
  userInitial: string;
  prompt: string;
};

export function ComposerPrompt({ userInitial, prompt }: ComposerPromptProps) {
  return (
    <a
      href="#"
      className="mb-6 flex items-center gap-[14px] rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-[14px] shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
    >
      <Avatar initial={userInitial} size={40} backgroundColor="#F2937A" color="#FFFFFF" />
      <span className="flex-1 text-[15px] text-[#A89A8B]">{prompt}</span>
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-[#FBE3D8] text-[#E0654A]">
        <CameraIcon />
      </span>
    </a>
  );
}
