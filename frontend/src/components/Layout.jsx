import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, ScanLine, Code2, MapPinned, Tags,
  BarChart3, ListChecks, GitCompare, Camera,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, testid: "nav-dashboard" },
  { to: "/auditor", label: "Site Auditor", icon: ScanLine, testid: "nav-auditor" },
  { to: "/schema", label: "Schema Generator", icon: Code2, testid: "nav-schema" },
  { to: "/locations", label: "Location Pages", icon: MapPinned, testid: "nav-locations" },
  { to: "/meta", label: "Meta Optimiser", icon: Tags, testid: "nav-meta" },
  { to: "/keywords", label: "Keyword Density", icon: BarChart3, testid: "nav-keywords" },
  { to: "/tasks", label: "SEO Checklist", icon: ListChecks, testid: "nav-tasks" },
  { to: "/compare", label: "Competitor Snap", icon: GitCompare, testid: "nav-compare" },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex grain" data-testid="app-shell">
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 border-r border-white/10 bg-[#0c0c0e] hidden md:flex flex-col"
        data-testid="sidebar"
      >
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md gold-bg flex items-center justify-center">
              <Camera className="w-4 h-4 text-black" />
            </div>
            <div className="leading-tight">
              <div className="heading text-sm font-semibold text-white">Weddings By Mark</div>
              <div className="text-[10px] uppercase tracking-[0.2em] gold mono">SEO · Command</div>
            </div>
          </div>
        </div>
        <nav className="p-3 flex-1">
          {NAV.map(({ to, label, icon: Icon, end, testid }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-md text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-white/5 text-white border border-white/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 text-[10px] text-zinc-500 mono">
          v1.0 · self-hosted · no external APIs
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 relative">
        {/* Mobile top nav */}
        <div className="md:hidden border-b border-white/10 px-4 py-3 flex items-center gap-2 bg-[#0c0c0e]">
          <div className="w-7 h-7 rounded gold-bg flex items-center justify-center">
            <Camera className="w-4 h-4 text-black" />
          </div>
          <div className="heading text-sm font-semibold">Weddings By Mark · SEO</div>
        </div>
        <div className="md:hidden border-b border-white/10 px-2 py-2 overflow-x-auto whitespace-nowrap">
          {NAV.map(({ to, label, icon: Icon, end, testid }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={`mobile-${testid}`}
              className={({ isActive }) =>
                `inline-flex items-center gap-1 px-3 py-1.5 mx-1 text-xs rounded-md ${
                  isActive ? "bg-white/10 text-white" : "text-zinc-400"
                }`
              }
            >
              <Icon className="w-3 h-3" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
