import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, Search } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { incidentService } from "../../services/cyberShieldApi.js";
import { formatDate } from "../../utils/formatters.js";

export default function IncidentTrackerPage() {
  const [incidents, setIncidents] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    incidentService.list().then(setIncidents);
  }, []);

  const filtered = useMemo(() => {
    return incidents.filter((incident) => `${incident.title} ${incident.reference_number} ${incident.affected_system}`.toLowerCase().includes(query.toLowerCase()));
  }, [incidents, query]);

  return (
    <div>
      <PageHeader
        eyebrow="Case tracking"
        title="Incident Reports"
        description="Track reference numbers, severity, assignments, response status, and timeline updates."
        actions={
          <Button as={Link} to="/incidents/new">
            <FilePlus2 className="h-4 w-4" />
            New report
          </Button>
        }
      />
      <Card className="mb-6">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 pl-10 pr-3 text-white" placeholder="Search incidents" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="pb-3">Reference</th>
                <th className="pb-3">Title</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Assigned</th>
                <th className="pb-3">Occurred</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((incident) => (
                <tr key={incident.id} className="align-top">
                  <td className="py-4 font-mono text-cyanx">{incident.reference_number}</td>
                  <td className="py-4">
                    <p className="font-semibold text-white">{incident.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{incident.affected_system}</p>
                  </td>
                  <td className="py-4"><StatusBadge value={incident.severity} /></td>
                  <td className="py-4"><StatusBadge value={incident.status} /></td>
                  <td className="py-4 text-slate-300">{incident.assigned_to?.email || "Unassigned"}</td>
                  <td className="py-4 text-slate-400">{formatDate(incident.occurred_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
