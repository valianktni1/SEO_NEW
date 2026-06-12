import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { MapPin, FileDown, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Locations() {
  const [regions, setRegions] = useState([]);
  const [active, setActive] = useState(null);
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/locations").then(r => setRegions(r.data.regions));
  }, []);

  const generate = async (region, town) => {
    setLoading(true);
    setActive({ region, town });
    setOutput(null);
    try {
      const r = await api.post("/location-page", { town, region });
      setOutput(r.data);
      toast.success(`Generated page for ${town}`);
    } catch (e) {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const download = () => {
    if (!output) return;
    const blob = new Blob([output.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${output.slug}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const totalTowns = regions.reduce((s, r) => s + r.towns.length, 0);

  return (
    <div data-testid="locations-page">
      <SectionHeader
        eyebrow="Tool · 03"
        title="Location Page Builder"
        subtitle={`${totalTowns} towns pre-loaded across your target regions. Each click generates a unique, SEO-ready page with title, meta, H1, body and per-page schema.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {regions.map((region, idx) => (
            <div key={region.region} className="surface p-5 fade-up" style={{ animationDelay: `${idx * 0.05}s` }} data-testid={`region-${region.region.replace(/\s+/g, "-").toLowerCase()}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="heading text-md flex items-center gap-2">
                  <MapPin className="w-4 h-4 gold" />
                  {region.region}
                </h3>
                <span className="mono text-xs text-zinc-500">{region.towns.length} towns</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {region.towns.map(town => (
                  <button
                    key={town}
                    data-testid={`town-${town.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => generate(region.region, town)}
                    disabled={loading}
                    className={`text-xs px-2.5 py-1.5 rounded border transition-all duration-200 ${
                      active?.town === town
                        ? "gold-bg text-black border-transparent"
                        : "bg-white/[0.02] text-zinc-300 border-white/10 hover:bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {town}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3 surface p-6 fade-up delay-1 self-start" data-testid="location-output">
          <div className="flex items-center justify-between mb-3">
            <h2 className="heading text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 gold" />
              {output ? `${output.town}, ${output.region}` : "Pick a town →"}
            </h2>
            {output && (
              <div className="flex gap-2">
                <Button
                  data-testid="copy-md-btn"
                  variant="secondary"
                  onClick={() => copy(output.markdown, "Markdown")}
                  className="bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  <Copy className="w-3 h-3" /> Copy MD
                </Button>
                <Button
                  data-testid="download-md-btn"
                  variant="secondary"
                  onClick={download}
                  className="bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  <FileDown className="w-3 h-3" /> Download
                </Button>
              </div>
            )}
          </div>

          {!output ? (
            <div className="text-zinc-500 text-sm py-12 text-center border border-dashed border-white/10 rounded-md">
              Click any town on the left to generate a page.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono">Slug</div>
                <div className="mono text-sm text-zinc-200 mt-1">/{output.slug}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono">Title ({output.title_length} ch)</div>
                <div className="text-sm text-zinc-100 mt-1">{output.title}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono">Meta description ({output.meta_length} ch)</div>
                <div className="text-sm text-zinc-300 mt-1">{output.meta_description}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono mb-1">Body (Markdown)</div>
                <pre className="term whitespace-pre-wrap max-h-[400px]">{output.markdown}</pre>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono mb-1">JSON-LD schema</div>
                  <Button
                    data-testid="copy-schema-btn"
                    variant="secondary"
                    onClick={() => copy(output.schema_tag, "Schema")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-xs"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                </div>
                <pre className="term whitespace-pre-wrap max-h-[260px]">{output.schema_tag}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
