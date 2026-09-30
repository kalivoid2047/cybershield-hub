import { useState } from "react";
import StatusBadge from "../common/StatusBadge.jsx";
import { titleCase } from "../../utils/formatters.js";

const statuses = ["open", "investigating", "escalated", "resolved", "closed"];

const controlClass = "focus-ring min-h-8 w-full rounded-md border border-white/10 bg-white/7 px-2 text-xs text-white";

function IncidentActions({ incident, onAssign, onTransition }) {
  const [status, setStatus] = useState(incident.status);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
      setNote("");
    } catch {
      setError("Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const canApply = status !== incident.status && note.trim() && !busy;

  return (
    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
      <select className={controlClass} aria-label="New status" value={status} onChange={(event) => setStatus(event.target.value)}>
        {statuses.map((value) => (
          <option key={value} value={value} className="bg-panel">
            {titleCase(value)}
          </option>
        ))}
      </select>
      <input className={controlClass} aria-label="Update note" placeholder="Note (required)" value={note} onChange={(event) => setNote(event.target.value)} />
      <div className="flex gap-2">
        <button type="button" className="focus-ring rounded-md bg-cyanx px-2 py-1 text-xs font-semibold text-void disabled:opacity-50" disabled={!canApply} onClick={() => run(() => onTransition(incident, status, note.trim()))}>
          Apply
        </button>
        <button type="button" className="focus-ring rounded-md border border-white/12 px-2 py-1 text-xs text-slate-200 hover:bg-white/8 disabled:opacity-50" disabled={busy} onClick={() => run(() => onAssign(incident))}>
          Assign to me
        </button>
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}

export default function KanbanBoard({ grouped = {}, onAssign, onTransition }) {
  const interactive = Boolean(onAssign && onTransition);
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
                {incident.assigned_to && <p className="mt-1 text-xs text-slate-500">Assigned: {incident.assigned_to.email || incident.assigned_to}</p>}
                {interactive && <IncidentActions incident={incident} onAssign={onAssign} onTransition={onTransition} />}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
