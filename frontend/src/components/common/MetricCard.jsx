import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Skeleton } from "./Skeleton.jsx";

const tones = {
  cyan: "text-cyanx bg-cyanx/12 border-cyanx/20",
  green: "text-mint bg-mint/12 border-mint/20",
  amber: "text-amberx bg-amberx/12 border-amberx/20",
  rose: "text-danger bg-danger/12 border-danger/20",
};

// `to` turns the whole card into a link; `loading` swaps the value for a
// placeholder so a real 0 is never confused with "not loaded yet".
export default function MetricCard({ icon: Icon, label, value, detail, tone = "cyan", to, loading = false }) {
  const body = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        {loading ? <Skeleton className="mt-3 h-8 w-20" /> : <p className="mt-2 text-3xl font-bold text-white">{value}</p>}
        <p className="mt-2 text-sm text-slate-400">{detail}</p>
      </div>
      {Icon && (
        <div className={clsx("rounded-md border p-3", tones[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    </div>
  );

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-lg">
      {to ? (
        <Link to={to} className="focus-ring block rounded-lg p-5 transition hover:bg-white/[0.04]">
          {body}
        </Link>
      ) : (
        <div className="p-5">{body}</div>
      )}
    </motion.section>
  );
}
