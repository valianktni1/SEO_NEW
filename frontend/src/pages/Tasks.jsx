import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import SectionHeader from "@/components/SectionHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { Flame, ListChecks } from "lucide-react";
import { toast } from "sonner";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/tasks");
      setTasks(r.data.tasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id, completed) => {
    try {
      // optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
      await api.post(`/tasks/${id}/toggle`, { completed: !completed });
      if (!completed) toast.success("Nice — task ticked off");
    } catch (e) {
      toast.error("Could not update task");
      load();
    }
  };

  const categories = ["All", ...Array.from(new Set(tasks.map(t => t.category)))];
  const filtered = filter === "All" ? tasks : tasks.filter(t => t.category === filter);

  const totalWeight = tasks.reduce((s, t) => s + t.weight, 0);
  const doneWeight = tasks.filter(t => t.completed).reduce((s, t) => s + t.weight, 0);
  const pct = totalWeight ? Math.round((doneWeight / totalWeight) * 100) : 0;
  const doneCount = tasks.filter(t => t.completed).length;

  return (
    <div data-testid="tasks-page">
      <SectionHeader
        eyebrow="Tool · 06"
        title="Ethical SEO Checklist"
        subtitle="50 prioritised, weighted, ethical tasks. No shortcuts, no black-hat. Check them off as you go — your dashboard tracks the streak."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div className="surface p-6 fade-up">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mono">Completion</div>
          <div className="heading text-5xl font-light mt-3">{pct}%</div>
          <div className="h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
            <div className="h-full gold-bg" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="surface p-6 fade-up delay-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mono">Tasks done</div>
          <div className="heading text-5xl font-light mt-3">
            {doneCount}<span className="text-zinc-500 text-xl"> / {tasks.length}</span>
          </div>
        </div>
        <div className="surface p-6 fade-up delay-2 flex items-center gap-3">
          <Flame className="w-10 h-10 text-amber-400" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mono">Weighted score</div>
            <div className="heading text-3xl font-light mt-1">
              {doneWeight}<span className="text-zinc-500 text-base"> / {totalWeight} pts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5" data-testid="tasks-filters">
        {categories.map(c => (
          <button
            key={c}
            data-testid={`filter-${c.toLowerCase()}`}
            onClick={() => setFilter(c)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-all duration-200 ${
              filter === c
                ? "gold-bg text-black border-transparent"
                : "bg-white/[0.02] text-zinc-300 border-white/10 hover:bg-white/5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="surface divide-y divide-white/5 fade-up delay-2">
        {filtered.map(t => (
          <label
            key={t.id}
            data-testid={`task-${t.id}`}
            className="flex items-start gap-4 px-5 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
          >
            <Checkbox
              data-testid={`task-cb-${t.id}`}
              checked={t.completed}
              onCheckedChange={() => toggle(t.id, t.completed)}
              className="mt-0.5 border-white/20 data-[state=checked]:bg-[#C5A059] data-[state=checked]:text-black"
            />
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${t.completed ? "text-zinc-500 line-through" : "text-zinc-100"}`}>
                {t.title}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mono mt-0.5">
                {t.category} · {t.weight} pts
                {t.completed_on && ` · done ${new Date(t.completed_on).toLocaleDateString()}`}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
