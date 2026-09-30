import { useState } from "react";
import { Flame, LayoutGrid, ListFilter, ShieldAlert } from "lucide-react";
import Card from "../../components/common/Card.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { Skeleton } from "../../components/common/Skeleton.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useToast } from "../../components/common/Toast.jsx";
import KanbanBoard from "../../components/incidents/KanbanBoard.jsx";
import IncidentManagePanel from "../../components/incidents/IncidentManagePanel.jsx";
import BarMetricChart from "../../components/charts/BarMetricChart.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import useAsync from "../../hooks/useAsync.js";
import { incidentService } from "../../services/cyberShieldApi.js";
import { titleCase } from "../../utils/formatters.js";

export default function SOCDashboardPage() {
  const { data, loading, error, reload, setData } = useAsync(() => incidentService.queue().then((queue) => queue || {}), []);
  const queue = data || {};
  const [managing, setManaging] = useState(null);
  const { user } = useAuth();
  const toast = useToast();

  async function refreshQueue() {
    setData(await incidentService.queue().then((next) => next || {}));
  }

  // Panel handlers throw on failure so the panel can show an error; on success
  // the queue is reloaded so the card moves to its new column.
  async function handleAssign(incident) {
    await incidentService.assign(incident.id, user.id);
    await refreshQueue();
    toast.success(`${incident.reference_number} assigned to you.`);
    setManaging(null);
  }

  async function handleTransition(incident, status, note) {
    await incidentService.transition(incident.id, status, note);
    await refreshQueue();
    toast.success(`${incident.reference_number} moved to ${titleCase(status)}.`);
    setManaging(null);
  }

  const incidents = Object.values(queue).flat();
  const severityCounts = ["low", "medium", "high", "critical"].map((severity) => incidents.filter((incident) => incident.severity === severity).length);
  const busy = loading && !data;

  return (
    <div>
      <PageHeader
        eyebrow="SOC response"
        title="Incident Response Management"
        description="Triage queues, assignment signals, escalation state, severity heatmaps, and timeline-ready case context."
      />
      {error && (
        <div className="mb-6">
          <LoadError error={error} message="We couldn't load the incident queue." onRetry={reload} />
        </div>
      )}
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard loading={busy} icon={ShieldAlert} label="Open cases" value={(queue.open || []).length} detail="Awaiting triage" tone="cyan" />
        <MetricCard loading={busy} icon={ListFilter} label="Investigating" value={(queue.investigating || []).length} detail="Assigned work" tone="green" />
        <MetricCard loading={busy} icon={Flame} label="Escalated" value={(queue.escalated || []).length} detail="High attention" tone="rose" />
        <MetricCard loading={busy} icon={LayoutGrid} label="Resolved" value={(queue.resolved || []).length} detail="Ready for closure" tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Case queue</h2>
            <StatusBadge value="investigating" />
          </div>
          {busy ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5" role="status" aria-live="polite">
              <span className="sr-only">Loading queue…</span>
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-56" />
              ))}
            </div>
          ) : (
            <KanbanBoard grouped={queue} onManage={setManaging} />
          )}
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold text-white">Severity heatmap</h2>
            <BarMetricChart labels={["Low", "Medium", "High", "Critical"]} values={severityCounts} />
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold text-white">Priority cases</h2>
            <div className="space-y-3">
              {!busy && incidents.length === 0 && <p className="text-sm text-slate-400">No open cases right now.</p>}
              {incidents
                .slice()
                .sort((a, b) => b.priority_score - a.priority_score)
                .slice(0, 3)
                .map((incident) => (
                  <article key={incident.id} className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{incident.title}</p>
                      <StatusBadge value={incident.severity} />
                    </div>
                    <p className="mt-2 font-mono text-xs text-cyanx">{incident.reference_number}</p>
                  </article>
                ))}
            </div>
          </Card>
        </div>
      </div>
      {managing && <IncidentManagePanel key={managing.id} incident={managing} onClose={() => setManaging(null)} onAssign={handleAssign} onTransition={handleTransition} />}
    </div>
  );
}
