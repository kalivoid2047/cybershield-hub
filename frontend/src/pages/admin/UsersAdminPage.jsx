import { useMemo, useState } from "react";
import { UserCheck, Users } from "lucide-react";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { SearchInput } from "../../components/common/Field.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import { SkeletonCards } from "../../components/common/Skeleton.jsx";
import useAsync from "../../hooks/useAsync.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { adminService } from "../../services/cyberShieldApi.js";

export default function UsersAdminPage() {
  const { data, loading, error, reload } = useAsync(() => adminService.users().then((items) => (Array.isArray(items) ? items : [])), []);
  const users = data || [];
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => users.filter((user) => `${user.email} ${user.first_name} ${user.last_name} ${user.department}`.toLowerCase().includes(query.toLowerCase())), [users, query]);

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Users and Roles"
        description="Manage organization users, RBAC roles, activation status, and readiness scores."
      />
      <Card className="mb-6">
        <SearchInput label="Search users" placeholder="Search by name, email or department" value={query} onChange={(event) => setQuery(event.target.value)} />
      </Card>
      {loading ? (
        <SkeletonCards count={6} className="lg:grid-cols-2 xl:grid-cols-3" height="h-40" />
      ) : error ? (
        <LoadError error={error} message="We couldn't load users." onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description={query ? "Try a different search." : "No accounts exist yet."} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((user) => (
            <li key={user.id}>
              <Card className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-cyanx/12 text-sm font-bold text-cyanx" aria-hidden="true">
                      {user.first_name?.[0]}
                      {user.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-white">
                        {user.first_name} {user.last_name}
                      </h2>
                      <p className="truncate text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <UserCheck className="h-5 w-5 shrink-0 text-mint" aria-hidden="true" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge value={user.role?.code || "info"} />
                  {user.department && <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{user.department}</span>}
                </div>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-slate-400">
                    <span>Security score</span>
                    <span>{user.security_score}%</span>
                  </div>
                  <ProgressBar value={user.security_score} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
