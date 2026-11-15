import type { ConsentNoticeData } from "./auth-data";
import { CheckIcon } from "./CheckIcon";

type ConsentNoticeProps = {
  data: ConsentNoticeData;
};

export function ConsentNotice({ data }: ConsentNoticeProps) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-[14px] bg-[#FBF1D6] p-[14px_16px]">
      <span
        className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[#5FB97E] text-white"
        aria-hidden="true"
      >
        {data.checked ? <CheckIcon /> : null}
      </span>
      <span className="text-[14px] leading-[1.45] text-[#8A7234]">{data.text}</span>
    </div>
  );
}
