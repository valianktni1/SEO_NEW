import { useState } from "react";
import { api, DEFAULT_URL } from "@/lib/api";
import SectionHeader from "@/components/SectionHeader";
import ScorePill from "@/components/ScorePill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, CheckCircle2, AlertTriangle, XCircle, Lightbulb } from "lucide-react";
import { toast } from "sonner";

function CheckIcon({ status }) {
  if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "warn") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-rose-400" />;
}

export default function Auditor() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!url.trim()) return toast.error("Enter a URL");
    setLoading(true);
    setResult(null);
    try {
      const r = await api.post("/audit", { url: url.trim() });
      setResult(r.data);
      toast.success(`Audit complete — score ${r.data.score} (${r.data.grade})`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Audit failed");
    } finally {
      setLoading(false);
    }
  };

  const grouped = result?.checks?.reduce((acc, c) => {
    (acc[c.category] = acc[c.category] || []).push(c);
    return acc;
  }, {}) || {};

  return (
    <div data-testid="auditor-page">
      <SectionHeader
        eyebrow="Tool · 01"
        title="Site Auditor"
        subtitle="Paste any URL — we'll fetch it, parse the HTML and score 20+ on-page, technical and content factors. No external APIs used."
      />

      <div className="surface p-6 beam-input fade-up">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            data-testid="auditor-url-input"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://perfectweddingsbymark.uk"
            className="bg-black/30 border-white/10 text-white"
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
          <Button
            data-testid="auditor-run-btn"
            onClick={run}
            disabled={loading}
            className="gold-bg text-black hover:bg-[#D4AF37] sm:w-auto"
          >
            <ScanLine className="w-4 h-4" />
            {loading ? "Crawling…" : "Run Audit"}
          </Button>
        </div>
        <div className="text-xs text-zinc-500 mt-3 mono">
          Fetches HTML, checks meta, headings, schema, robots, sitemap, images & more.
        </div>
      </div>

      {result && (
        <>
          {/* Score banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            <div className="surface p-6 fade-up" data-testid="result-score">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mono">Overall score</div>
              <div className="mt-4">
                <ScorePill score={result.score} grade={result.grade} size="lg" />
              </div>
              <div className="text-xs text-zinc-500 mt-2 truncate mono">{result.final_url}</div>
            </div>
            <div className="surface p-6 fade-up delay-1 col-span-2" data-testid="result-summary">
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mono mb-3">At a glance</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <Stat label="Title" val={`${result.summary.title_length} ch`} />
                <Stat label="Meta desc" val={`${result.summary.meta_description_length} ch`} />
                <Stat label="H1 / H2" val={`${result.summary.h1_count} / ${result.summary.h2_count}`} />
                <Stat label="Words" val={result.summary.word_count} />
                <Stat label="Images" val={`${result.summary.image_count} (${result.summary.images_missing_alt} no alt)`} />
                <Stat label="Internal links" val={result.summary.internal_links} />
                <Stat label="External links" val={result.summary.external_links} />
                <Stat label="Page size" val={`${result.summary.page_size_kb} KB`} />
                <Stat label="HTTPS" val={result.summary.https ? "Yes" : "No"} />
                <Stat label="robots.txt" val={result.summary.has_robots ? "Yes" : "No"} />
                <Stat label="sitemap.xml" val={result.summary.has_sitemap ? "Yes" : "No"} />
                <Stat label="Schemas" val={result.summary.schemas_found?.length || 0} />
              </div>
            </div>
          </div>

          {/* Checks grouped */}
          {Object.entries(grouped).map(([cat, items], idx) => (
            <div key={cat} className="surface p-6 mt-5 fade-up" data-testid={`checks-${cat.toLowerCase()}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading text-lg">{cat}</h2>
                <span className="mono text-xs text-zinc-500">
                  {items.reduce((s, c) => s + c.points, 0)} / {items.reduce((s, c) => s + c.max, 0)} pts
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {items.map((c, i) => (
                  <div key={i} className="py-3 flex items-start gap-3">
                    <CheckIcon status={c.status} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-zinc-200">{c.label}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 truncate">{c.detail}</div>
                    </div>
                    <div className="mono text-xs text-zinc-500 shrink-0">{c.points}/{c.max}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="surface p-6 mt-5 fade-up" data-testid="recommendations">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 gold" />
                <h2 className="heading text-lg">Recommended next steps</h2>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-300 marker:text-[#C5A059] marker:font-mono">
                {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, val }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono">{label}</div>
      <div className="text-zinc-100 text-sm mt-1">{val}</div>
    </div>
  );
}
