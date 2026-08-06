import { ShieldAlert } from "lucide-react";

export default function EmptyState({ title = "No records", description = "Nothing matches the current filters." }) {
  return (
    <div className="rounded-lg border border-dashed border-white/14 p-8 text-center">
      <ShieldAlert className="mx-auto h-8 w-8 text-cyanx" />
      <p className="mt-3 font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  );
}
