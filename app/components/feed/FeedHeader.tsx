type FeedHeaderProps = {
  orgLabel: string;
  greeting: string;
  meta: string;
};

export function FeedHeader({ orgLabel, greeting, meta }: FeedHeaderProps) {
  return (
    <div className="mb-6">
      <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-[#D9583C]">
        {orgLabel}
      </div>
      <h1 className="m-0 font-(family-name:--font-fredoka) text-[30px] font-semibold text-[#3F362E]">
        {greeting}
      </h1>
      <p className="mt-[5px] text-[14.5px] text-[#94887B]">{meta}</p>
    </div>
  );
}
