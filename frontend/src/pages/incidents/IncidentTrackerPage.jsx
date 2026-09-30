import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, FilePlus2, SearchX } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { Select, SearchInput } from "../../components/common/Field.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { SkeletonRows } from "../../components/common/Skeleton.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import useAsync from "../../hooks/useAsync.js";
import { incidentService } from "../../services/cyberShieldApi.js";
import { formatDate, titleCase } from "../../utils/formatters.js";

const PAGE_SIZE = 10;
const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
const sorters = {
  newest: (a, b) => new Date(b.occurred_at || 0) - new Date(a.occurred_at || 0),
  oldest: (a, b) => new Date(a.occurred_at || 0) - new Date(b.occurred_at || 0),
  severity: (a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0) || new Date(b.occurred_at || 0) - new Date(a.occurred_at || 0),
};

export default function IncidentTrackerPage() {
  const { data, loading, error, reload } = useAsync(() => incidentService.list().then((items) => (Array.isArray(items) ? items : [])), []);
  const incidents = data || [];
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return incidents
      .filter((incident) => status === "all" || incident.status === status)
      .filter((incident) => severity === "all" || incident.severity === severity)
      .filter((incident) => !needle || `${incident.title} ${incident.reference_number} ${incident.affected_system}`.toLowerCase().includes(needle))
      .sort(sorters[sort]);
  }, [incidents, query, status, severity, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => setPage(1), [query, status, severity, sort]);
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtersActive = query || status !== "all" || severity !== "all";

  function clearFilters() {
    setQuery("");
    setStatus("all");
    setSeverity("all");
  }

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
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px_180px]">
          <SearchInput className="md:col-span-2 xl:col-span-1" label="Search incidents" placeholder="Search by title, reference or system" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select label="Status" hideLabel value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            {["open", "investigating", "escalated", "resolved", "closed"].map((value) => (
              <option key={value} value={value}>
                {titleCase(value)}
              </option>
            ))}
          </Select>
          <Select label="Severity" hideLabel value={severity} onChange={(event) => setSeverity(event.target.value)}>
            <option value="all">All severities</option>
            {["critical", "high", "medium", "low"].map((value) => (
              <option key={value} value={value}>
                {titleCase(value)}
              </option>
            ))}
          </Select>
          <Select label="Sort by" hideLabel value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="severity">Highest severity</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <Card>
          <SkeletonRows />
        </Card>
      ) : error ? (
        <LoadError error={error} message="We couldn't load incidents." onRetry={reload} />
      ) : incidents.length === 0 ? (
        <EmptyState
          title="No incidents reported"
          description="Spotted something suspicious? Report it so the security team can respond."
          action={
            <Button as={Link} to="/incidents/new">
              <FilePlus2 className="h-4 w-4" />
              Report an incident
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching incidents"
          description="Try a different search or clear the filters."
          action={
            filtersActive && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <Card>
          <p className="sr-only" role="status">
            {filtered.length} incidents shown
          </p>
          {/* Table on wider screens... */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Incident reports</caption>
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th scope="col" className="pb-3">Reference</th>
                  <th scope="col" className="pb-3">Title</th>
                  <th scope="col" className="pb-3">Severity</th>
                  <th scope="col" className="pb-3">Status</th>
                  <th scope="col" className="pb-3">Assigned</th>
                  <th scope="col" className="pb-3">Occurred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {visible.map((incident) => (
                  <tr key={incident.id} className="align-top transition hover:bg-white/[0.03]">
                    <td className="py-4 pr-3 font-mono text-cyanx">
                      <Link to={`/incidents/${incident.id}`} className="focus-ring rounded underline-offset-2 hover:underline">
                        {incident.reference_number}
                      </Link>
                    </td>
                    <td className="py-4 pr-3">
                      <p className="font-semibold text-white">{incident.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{incident.affected_system}</p>
                    </td>
                    <td className="py-4 pr-3"><StatusBadge value={incident.severity} /></td>
                    <td className="py-4 pr-3"><StatusBadge value={incident.is_draft ? "draft" : incident.status} /></td>
                    <td className="py-4 pr-3 text-slate-300">{incident.assigned_to?.email || "Unassigned"}</td>
                    <td className="py-4 text-slate-400">{formatDate(incident.occurred_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* ...stacked cards on phones, so nothing scrolls sideways. */}
          <ul className="space-y-3 md:hidden">
            {visible.map((incident) => (
              <li key={incident.id}>
                <Link to={`/incidents/${incident.id}`} className="focus-ring block rounded-md border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white">{incident.title}</p>
                    <StatusBadge value={incident.severity} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-cyanx">{incident.reference_number}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <StatusBadge value={incident.is_draft ? "draft" : incident.status} />
                    <span>{formatDate(incident.occurred_at)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{incident.assigned_to?.email || "Unassigned"}</p>
                </Link>
              </li>
            ))}
          </ul>

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-sm text-slate-400">
                Page {current} of {pageCount} · {filtered.length} incidents
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="secondary" disabled={current === pageCount} onClick={() => setPage(current + 1)} aria-label="Next page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </nav>
          )}
        </Card>
      )}
    </div>
  );
}
