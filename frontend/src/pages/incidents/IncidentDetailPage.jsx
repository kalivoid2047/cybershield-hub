import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Paperclip } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { Skeleton } from "../../components/common/Skeleton.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import useAsync from "../../hooks/useAsync.js";
import { incidentService } from "../../services/cyberShieldApi.js";
import { formatDate, titleCase } from "../../utils/formatters.js";

function actorName(actor) {
  if (!actor) return "System";
  if (typeof actor === "string") return actor;
  return [actor.first_name, actor.last_name].filter(Boolean).join(" ") || actor.email || "System";
}

export default function IncidentDetailPage() {
  const { id } = useParams();
  const { data: incident, loading, error, reload } = useAsync(() => incidentService.detail(id), [id]);

  const back = (
    <Button as={Link} to="/incidents" variant="secondary">
      <ArrowLeft className="h-4 w-4" />
      All incidents
    </Button>
  );

  if (loading) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading incident…</span>
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="mb-8 h-9 w-80" />
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <Skeleton className="h-72" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !incident) {
    const notFound = error?.response?.status === 404 || (!error && !incident);
    return (
      <div>
        <PageHeader eyebrow="Case tracking" title="Incident" actions={back} />
        {notFound ? (
          <EmptyState title="Incident not found" description="It may have been removed, or it belongs to another account." />
        ) : (
          <LoadError error={error} message="We couldn't load this incident." onRetry={reload} />
        )}
      </div>
    );
  }

  const updates = [...(incident.updates || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div>
      <PageHeader eyebrow={incident.reference_number} title={incident.title} description={incident.category?.name} actions={back} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold text-white">Description</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-300">{incident.description || "No description provided."}</p>
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold text-white">Timeline</h2>
            {updates.length === 0 ? (
              <p className="text-sm text-slate-400">No updates yet. Status changes and notes from the response team will appear here.</p>
            ) : (
              <ol className="relative space-y-5 border-l border-white/10 pl-6">
                {updates.map((update) => (
                  <li key={update.id} className="relative">
                    <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyanx" aria-hidden="true" />
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {update.status_to && (
                        <span className="text-slate-300">
                          {update.status_from ? `${titleCase(update.status_from)} → ` : "Set to "}
                          <strong className="text-white">{titleCase(update.status_to)}</strong>
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatDate(update.created_at)} · {actorName(update.actor)}
                      </span>
                      {update.is_internal && <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-300">Internal</span>}
                    </div>
                    {update.note && <p className="mt-1 text-sm leading-6 text-slate-400">{update.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
        <aside className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold text-white">Details</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge value={incident.severity} />
              <StatusBadge value={incident.status} />
            </div>
            <dl className="space-y-3 text-sm">
              {[
                ["Affected system", incident.affected_system || "Not specified"],
                ["Occurred", formatDate(incident.occurred_at)],
                ["Reporter", actorName(incident.reporter)],
                ["Assigned to", incident.assigned_to ? actorName(incident.assigned_to) : "Unassigned"],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="text-xs text-slate-400">{term}</dt>
                  <dd className="mt-0.5 text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
              <Paperclip className="h-4 w-4 text-cyanx" aria-hidden="true" />
              Evidence
            </h2>
            {incident.attachments?.length ? (
              <ul className="space-y-2">
                {incident.attachments.map((file) => (
                  <li key={file.id}>
                    <a
                      href={file.file_url || file.file}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="focus-ring flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] p-2.5 text-sm text-cyanx hover:bg-white/[0.06]"
                    >
                      <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{file.original_name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No files attached.</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
