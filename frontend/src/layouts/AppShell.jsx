import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import SceneBackground from "../components/common/SceneBackground.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import useMediaQuery from "../hooks/useMediaQuery.js";
import { initials } from "../utils/formatters.js";
import { navGroups, sectionFor } from "./navigation.js";

function Sidebar({ open, isDesktop, onClose, closeRef }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  // While the drawer is closed on small screens it is only translated off
  // screen, so it must also be made inert or its links stay in the tab order.
  const hidden = !isDesktop && !open;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <aside
      id="app-sidebar"
      inert={hidden ? "" : undefined}
      className={clsx(
        "glass-strong fixed inset-y-0 left-0 z-50 flex w-72 flex-col rounded-r-3xl p-4 transition motion-reduce:transition-none lg:sticky lg:top-3 lg:m-3 lg:h-[calc(100vh-1.5rem)] lg:shrink-0 lg:translate-x-0 lg:self-start lg:rounded-3xl",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="mb-6 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyanx/40 bg-gradient-to-br from-cyanx/30 to-violetx/20 text-cyanx shadow-glow">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">CyberShield</p>
            <p className="text-xs text-slate-400">Hub</p>
          </div>
        </div>
        <button ref={closeRef} className="focus-ring rounded-md p-2 text-slate-300 lg:hidden" onClick={() => onClose(true)} type="button" aria-label="Close navigation">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Main" className="-mr-2 flex-1 space-y-5 overflow-y-auto pr-2">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => !item.roles || item.roles.includes(role));
          if (!items.length) return null;
          return (
            <div key={group.label || "root"}>
              {group.label && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{group.label}</p>}
              <div className="space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => onClose(false)}
                    className={({ isActive }) =>
                      clsx(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                        isActive
                          ? "bg-gradient-to-r from-cyanx/25 to-cyanx/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_0_24px_rgba(45,212,255,.18)] ring-1 ring-cyanx/30"
                          : "text-slate-300 hover:bg-white/8 hover:text-white",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="glass-tile mt-4 shrink-0 rounded-2xl p-3">
        <NavLink
          to="/account"
          onClick={() => onClose(false)}
          aria-label="Account and security settings"
          className="focus-ring -m-1 flex items-center gap-3 rounded-md p-1 transition hover:bg-white/8"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-mint/15 text-sm font-bold text-mint" aria-hidden="true">
            {initials(user)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </NavLink>
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

function ShellHeader({ onOpenNav, menuRef }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const section = sectionFor(pathname);
  const score = user?.security_score || 0;

  return (
    <header className="sticky top-3 z-30 px-4 pt-3 sm:px-6 lg:px-8">
      <div className="glass-strong flex min-h-16 items-center justify-between gap-4 rounded-2xl px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            ref={menuRef}
            className="focus-ring -ml-2 rounded-md p-2 text-slate-300 lg:hidden"
            onClick={onOpenNav}
            type="button"
            aria-label="Open navigation"
            aria-controls="app-sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs text-slate-400">{user?.organization || "CyberShield Hub"}</p>
            <p className="truncate text-base font-semibold text-white">{section || "CyberShield Hub"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className="focus-ring rounded-xl border border-cyanx/30 bg-gradient-to-b from-cyanx/20 to-cyanx/5 px-3 py-2 text-sm text-cyanx shadow-[inset_0_1px_0_rgba(255,255,255,.14)]"
            aria-label={`Security score ${score} out of 100, based on training, quizzes, phishing simulations and open incidents`}
            title="Security score: based on training, quizzes, phishing simulations and open incidents"
          >
            <span className="hidden sm:inline">Security score </span>
            <span className="font-semibold">{score}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Shell() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const location = useLocation();
  const mainRef = useRef(null);
  const menuRef = useRef(null);
  const closeRef = useRef(null);
  const firstRender = useRef(true);

  const closeNav = useCallback((restoreFocus) => {
    setOpen(false);
    // Wait a frame: the page behind the drawer is still inert until React re-renders.
    if (restoreFocus) requestAnimationFrame(() => menuRef.current?.focus());
  }, []);

  // Route changes: reset scroll and move focus into the page so keyboard and
  // screen-reader users land at the top of the new content.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    const heading = mainRef.current?.querySelector("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    } else {
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  // Drawer: focus the close button on open, close on Escape, and never keep the
  // drawer open after the viewport grows into the desktop layout.
  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") closeNav(true);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeNav]);

  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);

  const backgroundInert = !isDesktop && open ? "" : undefined;

  return (
    <div className="relative min-h-screen lg:flex">
      <SceneBackground />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar open={open} isDesktop={isDesktop} onClose={closeNav} closeRef={closeRef} />
      {open && <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => closeNav(true)} />}

      <div className="relative z-10 min-w-0 flex-1 overflow-x-clip" inert={backgroundInert}>
        <ShellHeader onOpenNav={() => setOpen(true)} menuRef={menuRef} />
        <main id="main-content" ref={mainRef} tabIndex={-1} className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: "easeOut" }}>
            <Suspense fallback={<p className="text-sm text-slate-400" role="status">Loading…</p>}>
              <Outlet />
            </Suspense>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function AppShell() {
  return (
    <Shell />
  );
}
