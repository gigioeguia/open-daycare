import type { AuthTextFieldData } from "./auth-data";

type AuthTextFieldProps = {
  field: AuthTextFieldData;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  errorId?: string;
};

export function AuthTextField({
  field,
  required,
  autoComplete,
  defaultValue,
  disabled,
  error,
  errorId,
}: AuthTextFieldProps) {
  const borderClass = error
    ? "border-[#D9684A]"
    : field.variant === "highlight"
      ? "border-[#F2A78E]"
      : "border-[#EADFD0]";

  const inputClassName = [
    "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none disabled:opacity-60",
    borderClass,
    field.letterSpacing
      ? "font-(family-name:--font-fredoka) text-[18px] font-bold tracking-[3px]"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label
        htmlFor={field.id}
        className="mb-2 block text-[12px] font-bold tracking-[0.7px] text-[#94887B]"
      >
        {field.label}
      </label>
      <input
        id={field.id}
        name={field.name}
        type={field.type}
        defaultValue={defaultValue ?? field.value}
        placeholder={field.placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error && errorId ? errorId : undefined}
        className={inputClassName}
      />
      {error && errorId ? (
        <p id={errorId} className="mt-2 text-[13px] font-semibold text-[#D9684A]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
