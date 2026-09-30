import { Link } from "react-router-dom";
import StatusBadge from "../common/StatusBadge.jsx";
import { titleCase } from "../../utils/formatters.js";
import { incidentStatuses } from "./IncidentManagePanel.jsx";

export default function KanbanBoard({ grouped = {}, onManage }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {incidentStatuses.map((status) => {
        const items = grouped[status] || [];
        return (
          <section key={status} aria-labelledby={`col-${status}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-3 xl:min-h-80">
            <div className="mb-3 flex items-center justify-between">
              <h3 id={`col-${status}`} className="text-sm font-semibold text-white">
                {titleCase(status)}
              </h3>
              <span className="rounded-full bg-white/8 px-2 py-1 text-xs text-slate-300">
                {items.length}
                <span className="sr-only"> cases</span>
              </span>
            </div>
            <ul className="space-y-3">
              {items.length === 0 && <li className="rounded-md border border-dashed border-white/10 p-3 text-center text-xs text-slate-400">No cases</li>}
              {items.map((incident) => (
                <li key={incident.id} className="rounded-md border border-white/10 bg-panel/80 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{incident.title}</p>
                    <StatusBadge value={incident.severity} />
                  </div>
                  <p className="mt-2 font-mono text-xs text-cyanx">{incident.reference_number}</p>
                  <p className="mt-2 text-xs text-slate-400">{incident.affected_system}</p>
                  <p className="mt-1 text-xs text-slate-400">Assigned: {incident.assigned_to?.email || incident.assigned_to || "Unassigned"}</p>
                  <div className="mt-3 flex gap-2">
                    {onManage ? (
                      <button
                        type="button"
                        onClick={() => onManage(incident)}
                        aria-label={`Manage ${incident.reference_number}: ${incident.title}`}
                        className="focus-ring min-h-10 flex-1 rounded-md border border-white/12 px-3 text-sm font-medium text-slate-100 transition hover:bg-white/8"
                      >
                        Manage
                      </button>
                    ) : (
                      <Link to={`/incidents/${incident.id}`} className="focus-ring min-h-10 flex-1 rounded-md border border-white/12 px-3 py-2 text-center text-sm font-medium text-slate-100 hover:bg-white/8">
                        View
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
