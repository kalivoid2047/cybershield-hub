import { ShieldCheck } from "lucide-react";

export default function AuthFrame({ title, subtitle, children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="grid-floor absolute inset-x-0 top-0 h-1/2" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(45,212,255,.18),transparent_34%)]" />
      <section className="glass-panel relative z-10 w-full max-w-md rounded-lg p-6">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-cyanx/30 bg-cyanx/12 text-cyanx shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">CyberShield Hub</p>
            <p className="text-xs text-slate-400">Enterprise security readiness</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </section>
    </main>
  );
}
