import { useEffect, useMemo, useState } from "react";
import { Search, UserCheck } from "lucide-react";
import Card from "../../components/common/Card.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { adminService } from "../../services/cyberShieldApi.js";

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    adminService.users().then(setUsers);
  }, []);

  const filtered = useMemo(() => users.filter((user) => `${user.email} ${user.first_name} ${user.last_name} ${user.department}`.toLowerCase().includes(query.toLowerCase())), [users, query]);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Users and Roles"
        description="Manage organization users, RBAC roles, activation status, and readiness scores."
      />
      <Card className="mb-6">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 pl-10 pr-3 text-white" placeholder="Search users" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((user) => (
          <Card key={user.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyanx/12 text-sm font-bold text-cyanx">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div>
                  <h2 className="font-semibold text-white">{user.first_name} {user.last_name}</h2>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
              </div>
              <UserCheck className="h-5 w-5 text-mint" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge value={user.role?.code || "info"} />
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{user.department}</span>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-slate-400">
                <span>Security score</span>
                <span>{user.security_score}%</span>
              </div>
              <ProgressBar value={user.security_score} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
