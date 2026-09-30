import clsx from "clsx";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const tones = {
  error: { box: "border-danger/30 bg-danger/10 text-rose-100", icon: AlertCircle, role: "alert" },
  warning: { box: "border-amberx/30 bg-amberx/10 text-amber-100", icon: TriangleAlert, role: "status" },
  success: { box: "border-mint/30 bg-mint/10 text-emerald-100", icon: CheckCircle2, role: "status" },
  info: { box: "border-cyanx/25 bg-cyanx/10 text-cyan-100", icon: Info, role: "status" },
};

export default function Alert({ tone = "info", className, children, id }) {
  const config = tones[tone];
  const Icon = config.icon;
  return (
    <div id={id} role={config.role} className={clsx("flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm", config.box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
