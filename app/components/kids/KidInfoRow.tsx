type KidInfoRowProps = {
  label: string;
  value: string;
  withBorder?: boolean;
};

export function KidInfoRow({ label, value, withBorder = false }: KidInfoRowProps) {
  return (
    <div
      className={`flex justify-between p-[15px_18px] ${withBorder ? "border-b border-[#F0E6D8]" : ""}`}
    >
      <span className="text-[14.5px] text-[#94887B]">{label}</span>
      <span className="text-[14.5px] font-extrabold text-[#3F362E]">{value}</span>
    </div>
  );
}
