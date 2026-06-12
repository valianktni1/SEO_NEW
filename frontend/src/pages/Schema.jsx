import { useState } from "react";
import { api, BUSINESS_NAME, DEFAULT_URL } from "@/lib/api";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Code2 } from "lucide-react";
import { toast } from "sonner";

export default function Schema() {
  const [f, setF] = useState({
    business_name: BUSINESS_NAME,
    website: DEFAULT_URL,
    description: "Documentary-style wedding photography across Lancashire, Manchester, Wirral, North Wales and Staffordshire.",
    phone: "",
    email: "",
    street: "",
    city: "",
    region: "Lancashire",
    postcode: "",
    country: "GB",
    price_range: "££",
    image_url: "",
    areas_served: "Lancashire, Greater Manchester, Wirral, North Wales, Staffordshire",
    rating_value: "",
    review_count: "",
  });
  const [out, setOut] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const generate = async () => {
    setLoading(true);
    try {
      const payload = {
        ...f,
        areas_served: f.areas_served.split(",").map(s => s.trim()).filter(Boolean),
        rating_value: f.rating_value ? parseFloat(f.rating_value) : null,
        review_count: f.review_count ? parseInt(f.review_count) : null,
      };
      const r = await api.post("/schema", payload);
      setOut(r.data);
      toast.success("Schema generated");
    } catch (e) {
      toast.error("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div data-testid="schema-page">
      <SectionHeader
        eyebrow="Tool · 02"
        title="Schema Generator"
        subtitle="Generate ready-to-paste LocalBusiness + Photographer JSON-LD. This is the single biggest local SEO win most wedding photographers miss."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="surface p-6 fade-up">
          <h2 className="heading text-lg mb-4">Business details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business name" k="business_name" f={f} set={set} />
            <Field label="Website URL" k="website" f={f} set={set} />
            <Field label="Phone" k="phone" f={f} set={set} placeholder="+44 7…" />
            <Field label="Email" k="email" f={f} set={set} />
            <Field label="Street" k="street" f={f} set={set} />
            <Field label="City / Town" k="city" f={f} set={set} />
            <Field label="Region / County" k="region" f={f} set={set} />
            <Field label="Postcode" k="postcode" f={f} set={set} />
            <Field label="Country code" k="country" f={f} set={set} />
            <Field label="Price range" k="price_range" f={f} set={set} placeholder="££ / £££" />
            <Field label="Hero image URL" k="image_url" f={f} set={set} className="sm:col-span-2" />
            <Field label="Areas served (comma)" k="areas_served" f={f} set={set} className="sm:col-span-2" />
            <Field label="Rating value (optional)" k="rating_value" f={f} set={set} placeholder="4.9" />
            <Field label="Review count (optional)" k="review_count" f={f} set={set} placeholder="42" />
            <div className="sm:col-span-2">
              <Label className="text-xs text-zinc-400">Description</Label>
              <Textarea
                data-testid="schema-description"
                value={f.description}
                onChange={set("description")}
                rows={3}
                className="bg-black/30 border-white/10 text-white mt-1"
              />
            </div>
          </div>
          <Button
            data-testid="schema-generate-btn"
            onClick={generate}
            disabled={loading}
            className="gold-bg text-black hover:bg-[#D4AF37] mt-5"
          >
            <Code2 className="w-4 h-4" />
            {loading ? "Generating…" : "Generate JSON-LD"}
          </Button>
        </div>

        <div className="surface p-6 fade-up delay-1 sticky top-6 self-start">
          <div className="flex items-center justify-between mb-3">
            <h2 className="heading text-lg">Output</h2>
            {out && (
              <Button
                data-testid="schema-copy-btn"
                variant="secondary"
                onClick={() => copy(out.script_tag)}
                className="bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <Copy className="w-3 h-3" /> Copy script tag
              </Button>
            )}
          </div>
          {out ? (
            <pre className="term whitespace-pre-wrap break-words" data-testid="schema-output">
              {out.script_tag}
            </pre>
          ) : (
            <div className="term text-zinc-600">// Click Generate to see your JSON-LD…</div>
          )}
          <div className="text-xs text-zinc-500 mt-3">
            Paste this inside the &lt;head&gt; of your site. Test with{" "}
            <a className="gold underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer">
              Google&apos;s Rich Results Test
            </a>.
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, k, f, set, placeholder, className }) {
  return (
    <div className={className}>
      <Label className="text-xs text-zinc-400">{label}</Label>
      <Input
        data-testid={`schema-${k}`}
        value={f[k]}
        onChange={set(k)}
        placeholder={placeholder}
        className="bg-black/30 border-white/10 text-white mt-1"
      />
    </div>
  );
}
