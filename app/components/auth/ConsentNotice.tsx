import type { ConsentNoticeData } from "./auth-data";
import { CheckIcon } from "./CheckIcon";

type ConsentNoticeProps = {
  data: ConsentNoticeData;
  interactive?: boolean;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  errorId?: string;
};

export function ConsentNotice({
  data,
  interactive = false,
  name = "consent",
  required = false,
  disabled = false,
  error,
  errorId,
}: ConsentNoticeProps) {
  if (!interactive) {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5">
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

  return (
    <div className="mb-6">
      <label className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-3.5">
        <span className="relative mt-px flex h-6 w-6 flex-none items-center justify-center">
          <input
            type="checkbox"
            name={name}
            defaultChecked={data.checked}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error && errorId ? errorId : undefined}
            className="peer h-6 w-6 appearance-none rounded-lg border border-[#D9C79A] bg-white checked:border-[#5FB97E] checked:bg-[#5FB97E] disabled:opacity-60"
          />
          <CheckIcon
            size={14}
            className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span className="text-[14px] leading-[1.45] text-[#8A7234]">{data.text}</span>
      </label>
      {error && errorId ? (
        <p id={errorId} className="mt-2 text-[13px] font-semibold text-[#D9684A]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
