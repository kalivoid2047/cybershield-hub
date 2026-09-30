import { Lock, Radar, ShieldCheck, Sparkles } from "lucide-react";
import SceneBackground from "../../components/common/SceneBackground.jsx";
import TiltCard from "../../components/common/TiltCard.jsx";
import Shield3D from "../../components/three/Shield3D.jsx";
import usePageTitle from "../../hooks/usePageTitle.js";

const highlights = [
  { icon: Sparkles, text: "Bite-sized training with real progress tracking" },
  { icon: Radar, text: "Phishing simulations that teach you to spot the signs" },
  { icon: Lock, text: "Incident response your security team can act on" },
];

export default function AuthFrame({ title, subtitle, children }) {
  usePageTitle(title);
  return (
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <SceneBackground />
      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div className="hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyanx/40 bg-gradient-to-br from-cyanx/30 to-violetx/20 text-cyanx shadow-glow">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="text-xl font-bold text-white">CyberShield Hub</p>
          </div>
          <h2 className="mt-8 text-4xl font-bold leading-tight text-gradient">Security awareness that people actually finish.</h2>
          <div className="my-6 flex justify-center lg:justify-start">
            <Shield3D size={280} />
          </div>
          <ul className="space-y-3">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="glass-tile flex h-8 w-8 items-center justify-center rounded-lg text-cyanx">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
        <TiltCard as="section" max={3} className="glass-panel mx-auto w-full max-w-md rounded-3xl p-7">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyanx/40 bg-gradient-to-br from-cyanx/30 to-violetx/20 text-cyanx shadow-glow">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">CyberShield Hub</p>
              <p className="text-xs text-slate-400">Enterprise security readiness</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </TiltCard>
      </div>
    </main>
  );
}
