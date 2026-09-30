import { ShieldAlert } from "lucide-react";

export default function EmptyState({ title = "No records", description = "Nothing matches the current filters.", icon: Icon = ShieldAlert, action }) {
  return (
    <div className="rounded-lg border border-dashed border-white/14 p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-cyanx" aria-hidden="true" />
      <p className="mt-3 font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
