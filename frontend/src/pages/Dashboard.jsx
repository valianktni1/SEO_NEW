import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, DEFAULT_URL } from "@/lib/api";
import SectionHeader from "@/components/SectionHeader";
import ScorePill from "@/components/ScorePill";
import { Button } from "@/components/ui/button";
import { Flame, Sparkles, History, ArrowRight, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/dashboard");
      setData(r.data);
    } catch (e) {
      toast.error("Could not load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const quickAudit = async () => {
    try {
      setRunning(true);
      await api.post("/audit", { url: DEFAULT_URL });
      toast.success("Audit complete");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Audit failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div data-testid="dashboard-page">
      <SectionHeader
        eyebrow="Mission Control"
        title="SEO Command Centre"
        subtitle="Self-hosted, ethical, no external paid APIs. Track your wedding photography SEO across Lancashire, Manchester, Wirral, North Wales and Staffordshire."
        right={
          <Button
            data-testid="quick-audit-btn"
            onClick={quickAudit}
            disabled={running}
            className="gold-bg text-black hover:bg-[#D4AF37]"
          >
            <Sparkles className="w-4 h-4" />
            {running ? "Auditing…" : "Audit perfectweddingsbymark.uk"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {/* SEO Score */}
        <div className="surface p-6 fade-up" data-testid="card-score">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mono">Latest SEO Score</div>
          <div className="mt-4">
            {data?.latest_audit ? (
              <ScorePill score={data.latest_audit.score} grade={data.latest_audit.grade} size="lg" />
            ) : (
              <div className="heading text-6xl font-light text-zinc-700">—</div>
            )}
          </div>
          <div className="text-xs text-zinc-500 mt-2 truncate mono">
            {data?.latest_audit?.url || "Run your first audit"}
          </div>
        </div>

        {/* Streak */}
        <div className="surface p-6 fade-up delay-1" data-testid="card-streak">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mono">Daily streak</div>
          <div className="mt-4 flex items-baseline gap-2">
            <Flame className="w-7 h-7 text-amber-400" />
            <span className="heading text-6xl font-light">{data?.streak_days ?? 0}</span>
            <span className="text-zinc-500 text-sm">days</span>
          </div>
          <div className="text-xs text-zinc-500 mt-2">Keep checking off tasks to keep it alive.</div>
        </div>

        {/* Completion */}
        <div className="surface p-6 fade-up delay-2" data-testid="card-completion">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mono">Checklist completion</div>
          <div className="mt-4 heading text-6xl font-light">
            {data?.completion_pct ?? 0}<span className="text-zinc-500 text-2xl">%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full gold-bg transition-all duration-700"
              style={{ width: `${data?.completion_pct ?? 0}%` }}
            />
          </div>
          <div className="text-xs text-zinc-500 mt-2 mono">
            {data?.tasks_done ?? 0} / {data?.tasks_total ?? 0} tasks done
          </div>
        </div>

        {/* Audits Run */}
        <div className="surface p-6 fade-up delay-3" data-testid="card-audits">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mono">Audits run</div>
          <div className="mt-4 heading text-6xl font-light">{data?.audit_history?.length ?? 0}</div>
          <Link to="/auditor" className="text-xs gold mono inline-flex items-center gap-1 mt-2 hover:underline">
            New audit <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Categories progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="surface p-6 fade-up delay-4" data-testid="card-categories">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 gold" />
            <h2 className="heading text-lg">Category progress</h2>
          </div>
          <div className="space-y-3">
            {data?.by_category ? Object.entries(data.by_category).map(([cat, v]) => {
              const pct = v.total ? Math.round((v.done / v.total) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300">{cat}</span>
                    <span className="mono text-zinc-500">{v.done}/{v.total}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full gold-bg" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) : <div className="text-zinc-500 text-sm">No data yet.</div>}
          </div>
          <Link to="/tasks">
            <Button variant="secondary" className="mt-5 bg-white/5 hover:bg-white/10 border border-white/10" data-testid="goto-tasks-btn">
              <ArrowRight className="w-3 h-3" /> Open checklist
            </Button>
          </Link>
        </div>

        {/* Recent audits */}
        <div className="surface p-6 fade-up delay-5" data-testid="card-history">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 gold" />
            <h2 className="heading text-lg">Recent audits</h2>
          </div>
          {(!data?.audit_history || data.audit_history.length === 0) ? (
            <div className="text-zinc-500 text-sm">No audits yet. Run your first one →</div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.audit_history.map(a => (
                <div key={a.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm text-zinc-200 truncate">{a.url}</div>
                    <div className="text-[11px] text-zinc-500 mono">
                      {new Date(a.fetched_at).toLocaleString()}
                    </div>
                  </div>
                  <ScorePill score={a.score} grade={a.grade} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 surface p-6 fade-up" data-testid="card-tools">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 gold" />
          <h2 className="heading text-lg">Tools</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: "/auditor", label: "Site Auditor", desc: "Score any URL" },
            { to: "/schema", label: "Schema Generator", desc: "JSON-LD in seconds" },
            { to: "/locations", label: "Location Pages", desc: "60+ town pages" },
            { to: "/meta", label: "Meta Optimiser", desc: "Titles + descriptions" },
            { to: "/keywords", label: "Keyword Density", desc: "Avoid over-stuffing" },
            { to: "/tasks", label: "SEO Checklist", desc: "50 ethical tasks" },
            { to: "/compare", label: "Competitor Snap", desc: "Side-by-side" },
          ].map(t => (
            <Link
              key={t.to}
              to={t.to}
              data-testid={`tool-link-${t.to.replace("/", "")}`}
              className="block p-4 rounded-md border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20 transition-all duration-200"
            >
              <div className="text-sm text-white">{t.label}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
