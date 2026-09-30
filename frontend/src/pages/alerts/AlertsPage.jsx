import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Megaphone, Search, ShieldAlert } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { alertService } from "../../services/cyberShieldApi.js";
import { formatDate, titleCase } from "../../utils/formatters.js";

export default function AlertsPage() {
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    alertService.notifications().then((data) => setNotifications(Array.isArray(data) ? data : []));
  }, []);

  const unread = notifications.filter((item) => !item.is_read).length;

  const filtered = useMemo(
    () => notifications.filter((item) => `${item.alert?.title} ${item.alert?.body}`.toLowerCase().includes(query.toLowerCase())),
    [notifications, query],
  );

  async function markRead(id) {
    setError("");
    try {
      await alertService.markRead(id);
      setNotifications((items) => items.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    } catch {
      setError("Could not update the notification.");
    }
  }

  async function markAllRead() {
    setError("");
    try {
      await alertService.markAllRead();
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    } catch {
      setError("Could not update notifications.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="Security Alerts"
        description="Threat advisories, announcements, daily cyber tips, and priority alert visibility."
        actions={
          <Button variant="secondary" onClick={markAllRead} disabled={unread === 0}>
            <CheckCheck className="h-4 w-4" />
            Mark all read{unread > 0 ? ` (${unread})` : ""}
          </Button>
        }
      />
      {error && <p className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      <Card className="mb-6">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 pl-10 pr-3 text-white" placeholder="Search alerts" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((item) => {
          const alert = item.alert || {};
          return (
            <Card key={item.id} className={item.is_read ? "opacity-70" : ""}>
              <div className="flex items-start gap-4">
                <div className="rounded-md border border-cyanx/20 bg-cyanx/10 p-3 text-cyanx">
                  {alert.alert_type === "threat_advisory" ? <ShieldAlert className="h-6 w-6" /> : alert.alert_type === "daily_tip" ? <Bell className="h-6 w-6" /> : <Megaphone className="h-6 w-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold text-white">
                      {!item.is_read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-cyanx" aria-label="Unread" />}
                      {alert.title}
                    </h2>
                    <StatusBadge value={alert.priority} />
                  </div>
                  <p className="text-sm leading-6 text-slate-400">{alert.body}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-white/10 px-2.5 py-1">{titleCase(alert.alert_type)}</span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1">{formatDate(alert.starts_at)}</span>
                    {!item.is_read && (
                      <button type="button" className="focus-ring ml-auto rounded-md px-2 py-1 text-cyanx hover:bg-white/8" onClick={() => markRead(item.id)}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
