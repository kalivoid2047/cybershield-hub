import { useEffect, useState } from "react";
import { Flame, LayoutGrid, ListFilter, ShieldAlert } from "lucide-react";
import Card from "../../components/common/Card.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import KanbanBoard from "../../components/incidents/KanbanBoard.jsx";
import BarMetricChart from "../../components/charts/BarMetricChart.jsx";
import { incidentService } from "../../services/cyberShieldApi.js";

export default function SOCDashboardPage() {
  const [queue, setQueue] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    incidentService.queue().then((data) => {
      setQueue(data || {});
      setLoaded(true);
    });
  }, []);

  const incidents = Object.values(queue).flat();
  const severityCounts = ["low", "medium", "high", "critical"].map((severity) => incidents.filter((incident) => incident.severity === severity).length);

  return (
    <div>
      <PageHeader
        eyebrow="SOC response"
        title="Incident Response Management"
        description="Triage queues, assignment signals, escalation state, severity heatmaps, and timeline-ready case context."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ShieldAlert} label="Open cases" value={(queue.open || []).length} detail="Awaiting triage" tone="cyan" />
        <MetricCard icon={ListFilter} label="Investigating" value={(queue.investigating || []).length} detail="Assigned work" tone="green" />
        <MetricCard icon={Flame} label="Escalated" value={(queue.escalated || []).length} detail="High attention" tone="rose" />
        <MetricCard icon={LayoutGrid} label="Resolved" value={(queue.resolved || []).length} detail="Ready for closure" tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Kanban queue</h2>
            <StatusBadge value="investigating" />
          </div>
          <KanbanBoard grouped={queue} />
        </Card>
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold text-white">Severity heatmap</h2>
            <BarMetricChart labels={["Low", "Medium", "High", "Critical"]} values={severityCounts} />
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold text-white">Priority cases</h2>
            <div className="space-y-3">
              {loaded && incidents.length === 0 && <p className="text-sm text-slate-400">No open cases right now.</p>}
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
    </div>
  );
}
