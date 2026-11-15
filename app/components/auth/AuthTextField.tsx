import type { AuthTextFieldData } from "./auth-data";

type AuthTextFieldProps = {
  field: AuthTextFieldData;
};

export function AuthTextField({ field }: AuthTextFieldProps) {
  const borderClass =
    field.variant === "highlight"
      ? "border-[#F2A78E]"
      : "border-[#EADFD0]";

  const inputClassName = [
    "w-full rounded-[14px] border-[1.5px] bg-white px-4 py-3.5 text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none",
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
        defaultValue={field.value}
        placeholder={field.placeholder}
        className={inputClassName}
      />
    </div>
  );
}
