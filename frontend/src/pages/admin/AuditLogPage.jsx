import { useMemo, useState } from "react";
import { Download, ScrollText } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { SearchInput } from "../../components/common/Field.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import { SkeletonRows } from "../../components/common/Skeleton.jsx";
import { useToast } from "../../components/common/Toast.jsx";
import useAsync from "../../hooks/useAsync.js";
import { errorMessage } from "../../utils/errors.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import { adminService } from "../../services/cyberShieldApi.js";
import { formatDate } from "../../utils/formatters.js";

export default function AuditLogPage() {
  const { data, loading, error, reload } = useAsync(() => adminService.auditLogs().then((items) => (Array.isArray(items) ? items : [])), []);
  const logs = data || [];
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await adminService.exportAuditLogs();
      toast.success("Audit log export downloaded.");
    } catch (err) {
      toast.error(errorMessage(err, "Export failed. Please try again."));
    } finally {
      setExporting(false);
    }
  }

  const filtered = useMemo(() => logs.filter((log) => `${log.actor?.email} ${log.action} ${log.resource_type} ${log.ip_address}`.toLowerCase().includes(query.toLowerCase())), [logs, query]);

  return (
    <div>
      <PageHeader
        eyebrow="Security record"
        title="Audit Logs"
        description="Immutable-style login, role, incident, admin action, and security change tracking."
        actions={
          <Button variant="secondary" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        }
      />
      <Card className="mb-6">
        <SearchInput label="Search audit trail" placeholder="Search by actor, action, resource or IP" value={query} onChange={(event) => setQuery(event.target.value)} />
      </Card>
      {loading ? (
        <Card>
          <SkeletonRows count={6} />
        </Card>
      ) : error ? (
        <LoadError error={error} message="We could not load the audit log." onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit entries" description={query ? "Nothing matches your search." : "Security events will be recorded here."} />
      ) : (
        <Card>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Audit log table">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th scope="col" className="pb-3">Time</th>
                  <th scope="col" className="pb-3">Actor</th>
                  <th scope="col" className="pb-3">Action</th>
                  <th scope="col" className="pb-3">Resource</th>
                  <th scope="col" className="pb-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="py-4 text-slate-400">{formatDate(log.created_at)}</td>
                    <td className="py-4 text-white">{log.actor?.email || "system"}</td>
                    <td className="py-4 font-mono text-cyanx">{log.action}</td>
                    <td className="py-4 text-slate-300">{log.resource_type}</td>
                    <td className="py-4 text-slate-400">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
