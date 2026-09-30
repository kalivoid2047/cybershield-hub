import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import { adminService } from "../../services/cyberShieldApi.js";
import { formatDate } from "../../utils/formatters.js";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  async function handleExport() {
    setExporting(true);
    setExportError("");
    try {
      await adminService.exportAuditLogs();
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    adminService.auditLogs().then(setLogs);
  }, []);

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
      {exportError && <p className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-rose-200">{exportError}</p>}
      <Card className="mb-6">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 pl-10 pr-3 text-white" placeholder="Search audit trail" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="pb-3">Time</th>
                <th className="pb-3">Actor</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Resource</th>
                <th className="pb-3">IP</th>
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
    </div>
  );
}
