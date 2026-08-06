import { motion } from "framer-motion";
import clsx from "clsx";

export default function MetricCard({ icon: Icon, label, value, detail, tone = "cyan" }) {
  const tones = {
    cyan: "text-cyanx bg-cyanx/12 border-cyanx/20",
    green: "text-mint bg-mint/12 border-mint/20",
    amber: "text-amberx bg-amberx/12 border-amberx/20",
    rose: "text-danger bg-danger/12 border-danger/20",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-lg p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-400">{detail}</p>
        </div>
        {Icon && (
          <div className={clsx("rounded-md border p-3", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.section>
  );
}
