import { useMemo, useState } from "react";
import { Bell, CheckCheck, Megaphone, SearchX, ShieldAlert } from "lucide-react";
import clsx from "clsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { SearchInput, Select } from "../../components/common/Field.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { SkeletonCards } from "../../components/common/Skeleton.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useToast } from "../../components/common/Toast.jsx";
import { useAlerts } from "../../contexts/AlertsContext.jsx";
import { errorMessage } from "../../utils/errors.js";
import { formatDate, titleCase } from "../../utils/formatters.js";

// Icon tile and unread accent follow priority, so an urgent advisory doesn't
// look identical to a daily tip.
const priorityStyle = {
  critical: { tile: "border-danger/30 bg-danger/12 text-danger", accent: "border-l-danger" },
  high: { tile: "border-orange-300/30 bg-orange-500/12 text-orange-200", accent: "border-l-orange-400" },
  medium: { tile: "border-amberx/30 bg-amberx/12 text-amberx", accent: "border-l-amberx" },
  info: { tile: "border-cyanx/20 bg-cyanx/10 text-cyanx", accent: "border-l-cyanx" },
};

function AlertIcon({ type }) {
  if (type === "threat_advisory") return <ShieldAlert className="h-6 w-6" aria-hidden="true" />;
  if (type === "daily_tip") return <Bell className="h-6 w-6" aria-hidden="true" />;
  return <Megaphone className="h-6 w-6" aria-hidden="true" />;
}

export default function AlertsPage() {
  const { notifications, unread, loading, error, reload, markRead, markAllRead } = useAlerts();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [type, setType] = useState("all");
  const [readState, setReadState] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return notifications.filter((item) => {
      const alert = item.alert || {};
      if (priority !== "all" && alert.priority !== priority) return false;
      if (type !== "all" && alert.alert_type !== type) return false;
      if (readState === "unread" && item.is_read) return false;
      if (needle && !`${alert.title} ${alert.body}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [notifications, query, priority, type, readState]);

  const filtersActive = query || priority !== "all" || type !== "all" || readState !== "all";

  async function handleMarkRead(id) {
    try {
      await markRead(id);
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the notification."));
    }
  }

  async function handleMarkAll() {
    const count = unread;
    try {
      await markAllRead();
      toast.success(`Marked ${count} alert${count === 1 ? "" : "s"} as read.`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not update notifications."));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="Security Alerts"
        description="Threat advisories, announcements, daily cyber tips, and priority alert visibility."
        actions={
          <Button variant="secondary" onClick={handleMarkAll} disabled={unread === 0}>
            <CheckCheck className="h-4 w-4" />
            Mark all read{unread > 0 ? ` (${unread})` : ""}
          </Button>
        }
      />
      <Card className="mb-6">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-[1fr_170px_190px_150px]">
          <SearchInput className="md:col-span-3 xl:col-span-1" label="Search alerts" placeholder="Search alerts" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select label="Priority" hideLabel value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="all">All priorities</option>
            {["critical", "high", "medium", "info"].map((value) => (
              <option key={value} value={value}>
                {titleCase(value)}
              </option>
            ))}
          </Select>
          <Select label="Type" hideLabel value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">All types</option>
            <option value="threat_advisory">Threat advisory</option>
            <option value="announcement">Announcement</option>
            <option value="daily_tip">Daily cyber tip</option>
          </Select>
          <Select label="Read status" hideLabel value={readState} onChange={(event) => setReadState(event.target.value)}>
            <option value="all">All</option>
            <option value="unread">Unread only</option>
          </Select>
        </div>
      </Card>

      {loading && !notifications.length ? (
        <SkeletonCards count={4} className="lg:grid-cols-2" height="h-36" />
      ) : error && !notifications.length ? (
        <LoadError error={error} message="We couldn't load your alerts." onRetry={reload} />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No alerts yet" description="Threat advisories and announcements from your security team will show up here." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching alerts"
          description="Try a different search or clear the filters."
          action={
            filtersActive && (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setPriority("all");
                  setType("all");
                  setReadState("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {filtered.map((item) => {
            const alert = item.alert || {};
            const style = priorityStyle[alert.priority] || priorityStyle.info;
            return (
              <li key={item.id}>
                <Card className={clsx("h-full border-l-4", item.is_read ? "border-l-transparent" : style.accent)}>
                  <div className="flex items-start gap-4">
                    <div className={clsx("rounded-md border p-3", style.tile)}>
                      <AlertIcon type={alert.alert_type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h2 className={clsx("text-white", item.is_read ? "font-semibold" : "font-bold")}>
                          {!item.is_read && <span className="sr-only">Unread: </span>}
                          {alert.title}
                        </h2>
                        <StatusBadge value={alert.priority} />
                      </div>
                      <p className="text-sm leading-6 text-slate-300">{alert.body}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="rounded-full border border-white/10 px-2.5 py-1">{titleCase(alert.alert_type)}</span>
                        <span className="rounded-full border border-white/10 px-2.5 py-1">{formatDate(alert.starts_at)}</span>
                        {item.is_read ? (
                          <span className="ml-auto inline-flex items-center gap-1 text-slate-400">
                            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Read
                          </span>
                        ) : (
                          <button type="button" className="focus-ring ml-auto min-h-9 rounded-md px-3 text-sm text-cyanx hover:bg-white/8" onClick={() => handleMarkRead(item.id)}>
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
