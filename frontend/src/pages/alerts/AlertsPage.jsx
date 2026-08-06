import { useEffect, useMemo, useState } from "react";
import { Bell, Megaphone, Search, ShieldAlert } from "lucide-react";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { alertService } from "../../services/cyberShieldApi.js";
import { formatDate, titleCase } from "../../utils/formatters.js";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    alertService.list().then(setAlerts);
  }, []);

  const filtered = useMemo(() => alerts.filter((alert) => `${alert.title} ${alert.body}`.toLowerCase().includes(query.toLowerCase())), [alerts, query]);

  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="Security Alerts"
        description="Threat advisories, announcements, daily cyber tips, and priority alert visibility."
      />
      <Card className="mb-6">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 pl-10 pr-3 text-white" placeholder="Search alerts" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((alert) => (
          <Card key={alert.id}>
            <div className="flex items-start gap-4">
              <div className="rounded-md border border-cyanx/20 bg-cyanx/10 p-3 text-cyanx">
                {alert.alert_type === "threat_advisory" ? <ShieldAlert className="h-6 w-6" /> : alert.alert_type === "daily_tip" ? <Bell className="h-6 w-6" /> : <Megaphone className="h-6 w-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold text-white">{alert.title}</h2>
                  <StatusBadge value={alert.priority} />
                </div>
                <p className="text-sm leading-6 text-slate-400">{alert.body}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded-full border border-white/10 px-2.5 py-1">{titleCase(alert.alert_type)}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1">{formatDate(alert.starts_at)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
