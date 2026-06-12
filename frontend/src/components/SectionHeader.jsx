export default function SectionHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div className="fade-up">
        {eyebrow && (
          <div className="text-[10px] uppercase tracking-[0.25em] gold mono mb-2" data-testid="section-eyebrow">
            {eyebrow}
          </div>
        )}
        <h1 className="heading text-3xl sm:text-4xl font-light text-white" data-testid="section-title">{title}</h1>
        {subtitle && <p className="text-zinc-400 text-sm mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
