import { useState } from "react";
import { api, BUSINESS_NAME } from "@/lib/api";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tags, Copy, Lightbulb } from "lucide-react";
import { toast } from "sonner";

const PAGE_TYPES = [
  { v: "home", l: "Homepage" },
  { v: "location", l: "Location page" },
  { v: "gallery", l: "Gallery page" },
  { v: "about", l: "About / Bio" },
  { v: "contact", l: "Contact" },
  { v: "pricing", l: "Pricing / Packages" },
  { v: "blog", l: "Blog post" },
];

export default function Meta() {
  const [pageType, setPageType] = useState("home");
  const [kw, setKw] = useState("Wedding Photography");
  const [loc, setLoc] = useState("");
  const [out, setOut] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const r = await api.post("/meta", {
        page_type: pageType,
        primary_keyword: kw,
        location: loc,
        business_name: BUSINESS_NAME,
      });
      setOut(r.data);
    } catch (e) {
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div data-testid="meta-page">
      <SectionHeader
        eyebrow="Tool · 04"
        title="Meta Tag Optimiser"
        subtitle="Generate SEO-optimised titles and meta descriptions for any page type. Built-in length guards keep Google happy."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="surface p-6 fade-up beam-input">
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-zinc-400">Page type</Label>
              <Select value={pageType} onValueChange={setPageType}>
                <SelectTrigger data-testid="meta-pagetype" className="bg-black/30 border-white/10 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_TYPES.map(p => (
                    <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Primary keyword</Label>
              <Input
                data-testid="meta-keyword"
                value={kw}
                onChange={e => setKw(e.target.value)}
                className="bg-black/30 border-white/10 text-white mt-1"
                placeholder="e.g. Wedding Photography"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">Location (optional)</Label>
              <Input
                data-testid="meta-location"
                value={loc}
                onChange={e => setLoc(e.target.value)}
                className="bg-black/30 border-white/10 text-white mt-1"
                placeholder="e.g. Lancashire"
              />
            </div>
            <Button
              data-testid="meta-generate-btn"
              onClick={generate}
              disabled={loading}
              className="gold-bg text-black hover:bg-[#D4AF37]"
            >
              <Tags className="w-4 h-4" />
              {loading ? "Generating…" : "Generate"}
            </Button>
          </div>
        </div>

        <div className="surface p-6 fade-up delay-1">
          {!out ? (
            <div className="text-zinc-500 text-sm py-12 text-center border border-dashed border-white/10 rounded-md">
              Output will appear here.
            </div>
          ) : (
            <div className="space-y-5" data-testid="meta-output">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono mb-2">Title options</div>
                <div className="space-y-2">
                  {out.titles.map((t, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-md border border-white/10 bg-white/[0.02]">
                      <div className="text-sm text-zinc-100">{t.text}</div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`mono text-xs ${t.length > 60 ? "text-amber-400" : "text-emerald-400"}`}>
                          {t.length} ch
                        </span>
                        <Button
                          data-testid={`meta-title-copy-${i}`}
                          variant="secondary"
                          onClick={() => copy(t.text)}
                          className="bg-white/5 hover:bg-white/10 border border-white/10"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono mb-2">Meta description</div>
                <div className="flex items-start justify-between gap-3 p-3 rounded-md border border-white/10 bg-white/[0.02]">
                  <div className="text-sm text-zinc-200">{out.description.text}</div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`mono text-xs ${out.description.length > 170 ? "text-amber-400" : "text-emerald-400"}`}>
                      {out.description.length} ch
                    </span>
                    <Button
                      data-testid="meta-desc-copy"
                      variant="secondary"
                      onClick={() => copy(out.description.text)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-3 h-3 gold" />
                  <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono">Tips</span>
                </div>
                <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside marker:text-[#C5A059]">
                  {out.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
