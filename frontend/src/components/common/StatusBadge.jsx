import clsx from "clsx";
import { titleCase } from "../../utils/formatters.js";

const tones = {
  low: "bg-emerald-400/12 text-emerald-200 border-emerald-300/20",
  medium: "bg-amber-400/12 text-amber-100 border-amber-300/20",
  high: "bg-orange-500/14 text-orange-100 border-orange-300/20",
  critical: "bg-rose-500/16 text-rose-100 border-rose-300/20",
  open: "bg-cyan-400/12 text-cyan-100 border-cyan-300/20",
  investigating: "bg-violet-400/12 text-violet-100 border-violet-300/20",
  escalated: "bg-rose-500/16 text-rose-100 border-rose-300/20",
  resolved: "bg-emerald-400/12 text-emerald-100 border-emerald-300/20",
  closed: "bg-slate-400/12 text-slate-200 border-slate-300/20",
  draft: "bg-slate-400/10 text-slate-200 border-dashed border-slate-300/30",
  info: "bg-sky-400/12 text-sky-100 border-sky-300/20",
};

export default function StatusBadge({ value, className }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,.14)] backdrop-blur-sm", tones[value] || tones.info, className)}>
      {titleCase(value)}
    </span>
  );
}
