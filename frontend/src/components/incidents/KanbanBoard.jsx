import StatusBadge from "../common/StatusBadge.jsx";
import { titleCase } from "../../utils/formatters.js";

const statuses = ["open", "investigating", "escalated", "resolved", "closed"];

export default function KanbanBoard({ grouped = {} }) {
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {statuses.map((status) => (
        <section key={status} className="min-h-80 rounded-lg border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{titleCase(status)}</h3>
            <span className="rounded-full bg-white/8 px-2 py-1 text-xs text-slate-300">{grouped[status]?.length || 0}</span>
          </div>
          <div className="space-y-3">
            {(grouped[status] || []).map((incident) => (
              <article key={incident.id} className="rounded-md border border-white/10 bg-panel/80 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{incident.title}</p>
                  <StatusBadge value={incident.severity} />
                </div>
                <p className="mt-2 font-mono text-xs text-cyanx">{incident.reference_number}</p>
                <p className="mt-2 text-xs text-slate-400">{incident.affected_system}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
