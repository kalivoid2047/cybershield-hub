import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Skeleton } from "./Skeleton.jsx";
import TiltCard from "./TiltCard.jsx";

const tones = {
  cyan: { tile: "text-cyanx border-cyanx/30 from-cyanx/25 to-cyanx/5", glow: "shadow-[0_8px_24px_rgba(45,212,255,.28)]" },
  green: { tile: "text-mint border-mint/30 from-mint/25 to-mint/5", glow: "shadow-[0_8px_24px_rgba(46,229,157,.26)]" },
  amber: { tile: "text-amberx border-amberx/30 from-amberx/25 to-amberx/5", glow: "shadow-[0_8px_24px_rgba(246,196,83,.24)]" },
  rose: { tile: "text-danger border-danger/30 from-danger/25 to-danger/5", glow: "shadow-[0_8px_24px_rgba(255,91,122,.26)]" },
};

// `to` turns the whole card into a link; `loading` swaps the value for a
// placeholder so a real 0 is never confused with "not loaded yet".
export default function MetricCard({ icon: Icon, label, value, detail, tone = "cyan", to, loading = false }) {
  const palette = tones[tone] || tones.cyan;
  const Tag = to ? Link : "div";

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <TiltCard
        as={Tag}
        {...(to ? { to } : {})}
        className={clsx("glass-panel block rounded-2xl p-5", to && "focus-ring")}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-slate-300">{label}</p>
            {loading ? <Skeleton className="mt-3 h-9 w-20" /> : <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>}
            <p className="mt-2 text-sm text-slate-400">{detail}</p>
          </div>
          {Icon && (
            <div className={clsx("parallax rounded-xl border bg-gradient-to-br p-3", palette.tile, palette.glow)}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
        </div>
      </TiltCard>
    </motion.div>
  );
}
