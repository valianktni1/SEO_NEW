import { useState } from "react";
import { api, DEFAULT_URL } from "@/lib/api";
import SectionHeader from "@/components/SectionHeader";
import ScorePill from "@/components/ScorePill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitCompare } from "lucide-react";
import { toast } from "sonner";

export default function Compare() {
  const [yourUrl, setYourUrl] = useState(DEFAULT_URL);
  const [compUrl, setCompUrl] = useState("");
  const [out, setOut] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!yourUrl || !compUrl) return toast.error("Both URLs required");
    setLoading(true);
    setOut(null);
    try {
      const r = await api.post("/compare", { your_url: yourUrl, competitor_url: compUrl });
      setOut(r.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Compare failed");
    } finally {
      setLoading(false);
    }
  };

  const rows = [
    { l: "Score", k: "score" },
    { l: "HTTPS", k: "https" },
    { l: "Title length", k: "title_length" },
    { l: "Meta desc length", k: "meta_description_length" },
    { l: "H1 count", k: "h1_count" },
    { l: "H2 count", k: "h2_count" },
    { l: "Word count", k: "word_count" },
    { l: "Images", k: "image_count" },
    { l: "Images missing alt", k: "images_missing_alt" },
    { l: "Internal links", k: "internal_links" },
    { l: "External links", k: "external_links" },
    { l: "robots.txt", k: "has_robots" },
    { l: "sitemap.xml", k: "has_sitemap" },
    { l: "Schemas", k: "schemas_found" },
    { l: "Page size (KB)", k: "page_size_kb" },
  ];

  const getVal = (side, k) => {
    if (k === "score") return side?.score;
    const v = side?.summary?.[k];
    if (Array.isArray(v)) return v.join(", ") || "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    return v ?? "—";
  };

  const winner = (k) => {
    if (!out) return null;
    const a = k === "score" ? out.your.score : out.your.summary[k];
    const b = k === "score" ? out.competitor.score : out.competitor.summary[k];
    if (typeof a === "boolean") return a === b ? null : (a ? "you" : "comp");
    if (typeof a === "number" && typeof b === "number") {
      if (k === "images_missing_alt" || k === "page_size_kb") {
        if (a < b) return "you"; if (b < a) return "comp"; return null;
      }
      if (a > b) return "you"; if (b > a) return "comp"; return null;
    }
    return null;
  };

  return (
    <div data-testid="compare-page">
      <SectionHeader
        eyebrow="Tool · 07"
        title="Competitor Snapshot"
        subtitle="Stack yourself side-by-side against another wedding photographer's site. See exactly where they're winning and where you can overtake them."
      />

      <div className="surface p-6 fade-up beam-input">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-zinc-400">Your URL</Label>
            <Input
              data-testid="cmp-you"
              value={yourUrl}
              onChange={e => setYourUrl(e.target.value)}
              className="bg-black/30 border-white/10 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">Competitor URL</Label>
            <Input
              data-testid="cmp-them"
              value={compUrl}
              onChange={e => setCompUrl(e.target.value)}
              placeholder="https://competitor.co.uk"
              className="bg-black/30 border-white/10 text-white mt-1"
            />
          </div>
        </div>
        <Button
          data-testid="cmp-run-btn"
          onClick={run}
          disabled={loading}
          className="gold-bg text-black hover:bg-[#D4AF37] mt-4"
        >
          <GitCompare className="w-4 h-4" />
          {loading ? "Comparing…" : "Compare"}
        </Button>
      </div>

      {out && (
        <div className="surface mt-5 overflow-hidden fade-up" data-testid="compare-result">
          <div className="grid grid-cols-3 gap-0 border-b border-white/10">
            <div className="p-5 border-r border-white/10">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono">You</div>
              <div className="text-sm text-zinc-100 truncate mt-1">{out.your.final_url}</div>
              <div className="mt-3"><ScorePill score={out.your.score} grade={out.your.grade} /></div>
            </div>
            <div className="p-5 flex items-center justify-center text-zinc-600 mono text-xs">vs</div>
            <div className="p-5 border-l border-white/10">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono">Competitor</div>
              <div className="text-sm text-zinc-100 truncate mt-1">{out.competitor.final_url}</div>
              <div className="mt-3"><ScorePill score={out.competitor.score} grade={out.competitor.grade} /></div>
            </div>
          </div>

          {rows.map(r => {
            const w = winner(r.k);
            return (
              <div key={r.k} className="grid grid-cols-3 border-b border-white/5 last:border-0">
                <div className={`p-3 text-sm ${w === "you" ? "text-emerald-400" : "text-zinc-300"} border-r border-white/10`}>
                  {getVal(out.your, r.k)}
                </div>
                <div className="p-3 text-center text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono">{r.l}</div>
                <div className={`p-3 text-sm text-right ${w === "comp" ? "text-emerald-400" : "text-zinc-300"} border-l border-white/10`}>
                  {getVal(out.competitor, r.k)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
