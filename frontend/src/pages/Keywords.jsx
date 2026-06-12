import { useState } from "react";
import { api } from "@/lib/api";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function Keywords() {
  const [text, setText] = useState("");
  const [targets, setTargets] = useState("wedding photographer, Lancashire wedding photographer, documentary wedding");
  const [out, setOut] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyse = async () => {
    if (!text.trim()) return toast.error("Paste some content first");
    setLoading(true);
    try {
      const r = await api.post("/keyword-density", {
        text,
        target_keywords: targets.split(",").map(s => s.trim()).filter(Boolean),
      });
      setOut(r.data);
    } catch (e) {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const colour = (status) =>
    status === "good" ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
      : status === "low" ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
        : "text-rose-400 border-rose-400/30 bg-rose-400/10";

  return (
    <div data-testid="keywords-page">
      <SectionHeader
        eyebrow="Tool · 05"
        title="Keyword Density Checker"
        subtitle="Paste any page text. We strip stopwords, count terms, and flag if you're under- or over-optimising your target keywords."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="surface p-6 fade-up">
          <Label className="text-xs text-zinc-400">Target keywords (comma-separated)</Label>
          <Input
            data-testid="kw-targets"
            value={targets}
            onChange={e => setTargets(e.target.value)}
            className="bg-black/30 border-white/10 text-white mt-1 mb-4"
          />
          <Label className="text-xs text-zinc-400">Page content (HTML or plain text)</Label>
          <Textarea
            data-testid="kw-text"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={16}
            className="bg-black/30 border-white/10 text-white mt-1 mono text-xs"
            placeholder="Paste the page content you want to analyse…"
          />
          <Button
            data-testid="kw-analyse-btn"
            onClick={analyse}
            disabled={loading}
            className="gold-bg text-black hover:bg-[#D4AF37] mt-4"
          >
            <BarChart3 className="w-4 h-4" />
            {loading ? "Analysing…" : "Analyse"}
          </Button>
        </div>

        <div className="space-y-5">
          {out && (
            <>
              <div className="surface p-6 fade-up" data-testid="kw-targets-result">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="heading text-lg">Target keywords</h2>
                  <div className="mono text-xs text-zinc-500">{out.total_words} words</div>
                </div>
                <div className="space-y-2">
                  {out.targets.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-md border border-white/10">
                      <div>
                        <div className="text-sm text-zinc-100">{t.keyword}</div>
                        <div className="text-xs text-zinc-500 mono">{t.count} occurrences · {t.density}% density</div>
                      </div>
                      <span className={`mono text-[10px] uppercase tracking-[0.15em] px-2 py-1 rounded border ${colour(t.status)}`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-zinc-500 mt-3">
                  Healthy density is roughly <span className="gold mono">0.5% – 3%</span>. Below = invisible. Above = stuffing.
                </div>
              </div>

              <div className="surface p-6 fade-up delay-1">
                <h3 className="heading text-md mb-3">Top phrases</h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  {[
                    { l: "Single", k: "single" },
                    { l: "Bigrams", k: "bigrams" },
                    { l: "Trigrams", k: "trigrams" },
                  ].map(col => (
                    <div key={col.k}>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono mb-2">{col.l}</div>
                      <div className="space-y-1">
                        {out[col.k].slice(0, 10).map((row, i) => (
                          <div key={i} className="flex justify-between gap-2 text-zinc-300">
                            <span className="truncate">{row.term}</span>
                            <span className="mono text-zinc-500">{row.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {!out && (
            <div className="surface p-6 text-zinc-500 text-sm text-center">
              Paste content and click Analyse to see results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
