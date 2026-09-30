import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, UserCheck } from "lucide-react";
import Alert from "../common/Alert.jsx";
import Button from "../common/Button.jsx";
import Dialog from "../common/Dialog.jsx";
import { Input, Select } from "../common/Field.jsx";
import StatusBadge from "../common/StatusBadge.jsx";
import { errorMessage } from "../../utils/errors.js";
import { formatDate, titleCase } from "../../utils/formatters.js";

export const incidentStatuses = ["open", "investigating", "escalated", "resolved", "closed"];

// Case actions live in a slide-over instead of being repeated inside every card,
// which kept the Kanban columns tall and noisy.
export default function IncidentManagePanel({ incident, onClose, onAssign, onTransition }) {
  const [status, setStatus] = useState(incident?.status || "open");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!incident) return null;
  const canApply = status !== incident.status && note.trim() && !busy;

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err, "That action failed. Please try again."));
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={incident.title} description={incident.reference_number}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={incident.severity} />
        <StatusBadge value={incident.status} />
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-400">Affected system</dt>
          <dd className="text-right text-white">{incident.affected_system || "Not specified"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-400">Assigned to</dt>
          <dd className="text-right text-white">{incident.assigned_to?.email || incident.assigned_to || "Unassigned"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-400">Occurred</dt>
          <dd className="text-right text-white">{formatDate(incident.occurred_at)}</dd>
        </div>
      </dl>
      <Link to={`/incidents/${incident.id}`} className="focus-ring mt-3 inline-flex items-center gap-1.5 self-start rounded text-sm text-cyanx hover:text-sky-200">
        Open full case and timeline
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>

      <form
        className="mt-6 space-y-4 border-t border-white/10 pt-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (canApply) run(() => onTransition(incident, status, note.trim()));
        }}
      >
        <h3 className="font-semibold text-white">Update status</h3>
        <Select label="New status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {incidentStatuses.map((value) => (
            <option key={value} value={value}>
              {titleCase(value)}
            </option>
          ))}
        </Select>
        <Input label="Note" hint="Required. Added to the case timeline." value={note} onChange={(event) => setNote(event.target.value)} />
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!canApply}>
            {busy ? "Working..." : "Apply update"}
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => run(() => onAssign(incident))}>
            <UserCheck className="h-4 w-4" />
            Assign to me
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
