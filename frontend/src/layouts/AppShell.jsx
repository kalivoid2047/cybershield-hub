import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { initials } from "../utils/formatters.js";

const navItems = [
  { label: "Command", to: "/", icon: LayoutDashboard },
  { label: "Training", to: "/training", icon: BookOpen },
  { label: "Quizzes", to: "/quizzes", icon: BrainCircuit },
  { label: "Phishing", to: "/phishing", icon: FileWarning },
  { label: "Incidents", to: "/incidents", icon: ClipboardList },
  { label: "SOC Queue", to: "/soc", icon: Activity, roles: ["cybersecurity_officer", "system_admin"] },
  { label: "Analytics", to: "/analytics", icon: BarChart3, roles: ["cybersecurity_officer", "system_admin"] },
  { label: "Alerts", to: "/alerts", icon: Bell },
  { label: "Users", to: "/admin/users", icon: Users, roles: ["system_admin"] },
  { label: "Audit", to: "/admin/audit", icon: ShieldCheck, roles: ["cybersecurity_officer", "system_admin"] },
];

function Sidebar({ open, onClose }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const visibleItems = navItems.filter((item) => !item.roles || item.roles.includes(role));

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-void/95 p-4 backdrop-blur-xl transition lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-cyanx/30 bg-cyanx/12 text-cyanx shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">CyberShield</p>
            <p className="text-xs text-slate-400">Hub</p>
          </div>
        </div>
        <button className="focus-ring rounded-md p-2 text-slate-300 lg:hidden" onClick={onClose} type="button" aria-label="Close navigation">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                isActive ? "bg-cyanx/14 text-white shadow-glow" : "text-slate-400 hover:bg-white/7 hover:text-white",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-mint/15 text-sm font-bold text-mint">
            {initials(user)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="focus-ring mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-white/10 text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <button type="button" aria-label="Close overlay" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <main className="relative flex-1 overflow-hidden">
        <div className="grid-floor pointer-events-none absolute inset-x-0 top-0 h-72" />
        <header className="sticky top-0 z-30 border-b border-white/10 bg-void/75 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button className="focus-ring rounded-md p-2 text-slate-300 lg:hidden" onClick={() => setOpen(true)} type="button" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm text-slate-400">Operations console</p>
              <p className="text-base font-semibold text-white">{user?.organization || "CyberShield Hub"}</p>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="rounded-md border border-mint/20 bg-mint/10 px-3 py-2 text-sm text-mint">Risk score {Math.max(0, 100 - (user?.security_score || 0))}</div>
              <div className="rounded-md border border-cyanx/20 bg-cyanx/10 px-3 py-2 text-sm text-cyanx">Security score {user?.security_score || 0}</div>
            </div>
          </div>
        </header>
        <div className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
