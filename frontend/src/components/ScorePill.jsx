export default function ScorePill({ score, grade, size = "md" }) {
  const color =
    score >= 80 ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
      : score >= 60 ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
        : "text-rose-400 border-rose-400/30 bg-rose-400/10";
  const sz = size === "lg" ? "text-6xl" : "text-3xl";
  return (
    <div className="flex items-baseline gap-2">
      <div className={`heading ${sz} font-light tracking-tighter`}>{score}</div>
      <div className={`mono text-xs px-2 py-0.5 rounded border ${color}`}>{grade}</div>
    </div>
  );
}
