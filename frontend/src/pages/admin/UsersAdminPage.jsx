import { useMemo, useState } from "react";
import { KeyRound, UserCheck, UserX, Users } from "lucide-react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { SearchInput, Select } from "../../components/common/Field.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProgressBar from "../../components/common/ProgressBar.jsx";
import { SkeletonCards } from "../../components/common/Skeleton.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useToast } from "../../components/common/Toast.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import useAsync from "../../hooks/useAsync.js";
import { adminService } from "../../services/cyberShieldApi.js";
import { errorMessage } from "../../utils/errors.js";

function UserCard({ user, roles, isSelf, onChange }) {
  const toast = useToast();
  const [busy, setBusy] = useState("");
  const [confirming, setConfirming] = useState(false);
  const active = user.is_active !== false;

  async function run(kind, action, success) {
    setBusy(kind);
    try {
      const updated = await action();
      onChange(updated && updated.id ? updated : { ...user });
      toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error, "That change could not be saved."));
    } finally {
      setBusy("");
      setConfirming(false);
    }
  }

  const changeRole = (event) => {
    const role = roles.find((item) => String(item.id) === event.target.value);
    if (role) run("role", () => adminService.updateUser(user.id, { role_id: role.id }), `${user.email} is now ${role.name}.`);
  };

  return (
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
              {isSelf && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}
            </h2>
            <p className="truncate text-sm text-slate-400">{user.email}</p>
          </div>
        </div>
        {active ? <UserCheck className="h-5 w-5 shrink-0 text-mint" aria-label="Active" /> : <UserX className="h-5 w-5 shrink-0 text-danger" aria-label="Deactivated" />}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!active && <span className="rounded-full border border-rose-300/30 bg-rose-500/12 px-2.5 py-1 text-xs font-semibold text-rose-100">Deactivated</span>}
        {user.department && <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">{user.department}</span>}
        {!user.is_email_verified && <span className="rounded-full border border-amberx/30 px-2.5 py-1 text-xs text-amber-100">Unverified email</span>}
      </div>
      <div className="mt-4">
        <Select label="Role" value={roles.find((role) => role.code === user.role?.code)?.id ?? ""} onChange={changeRole} disabled={isSelf || busy === "role" || roles.length === 0} hint={isSelf ? "You can't change your own role." : undefined}>
          {roles.length === 0 && <option value="">{user.role?.name || "Unknown"}</option>}
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex justify-between text-xs text-slate-400">
          <span>Security score</span>
          <span>{user.security_score}%</span>
        </div>
        <ProgressBar value={user.security_score} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {!isSelf &&
          (confirming ? (
            <>
              <Button variant="danger" className="min-h-9 px-3 py-1" disabled={busy === "active"} onClick={() => run("active", () => adminService.setUserActive(user.id, false), `${user.email} was deactivated.`)}>
                Confirm deactivate
              </Button>
              <Button variant="ghost" className="min-h-9 px-3 py-1" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : active ? (
            <Button variant="secondary" className="min-h-9 px-3 py-1" onClick={() => setConfirming(true)}>
              <UserX className="h-4 w-4" />
              Deactivate
            </Button>
          ) : (
            <Button variant="secondary" className="min-h-9 px-3 py-1" disabled={busy === "active"} onClick={() => run("active", () => adminService.setUserActive(user.id, true), `${user.email} was reactivated.`)}>
              <UserCheck className="h-4 w-4" />
              Reactivate
            </Button>
          ))}
        <Button
          variant="ghost"
          className="min-h-9 px-3 py-1"
          disabled={busy === "unlock"}
          onClick={() => run("unlock", () => adminService.resetFailedLogins(user.id), "Failed sign-in counter reset.")}
          title="Clears the failed sign-in counter so a locked-out user can try again"
        >
          <KeyRound className="h-4 w-4" />
          Unlock sign-in
        </Button>
      </div>
    </Card>
  );
}

export default function UsersAdminPage() {
  const { user: me } = useAuth();
  const { data, loading, error, reload, setData } = useAsync(() => adminService.users().then((items) => (Array.isArray(items) ? items : [])), []);
  const rolesQuery = useAsync(() => adminService.roles().then((items) => (Array.isArray(items) ? items : [])), []);
  const users = data || [];
  const roles = rolesQuery.data || [];
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users
      .filter((user) => roleFilter === "all" || user.role?.code === roleFilter)
      .filter((user) => !needle || `${user.email} ${user.first_name} ${user.last_name} ${user.department}`.toLowerCase().includes(needle));
  }, [users, query, roleFilter]);

  // Role/active changes come back as the full user; merge it into the list.
  function replace(id, updated) {
    setData((items) => items.map((item) => (item.id === id ? { ...item, ...updated } : item)));
  }

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Users and Roles" description="Manage organization users, RBAC roles, activation status, and readiness scores." />
      <Card className="mb-6">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <SearchInput label="Search users" placeholder="Search by name, email or department" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select label="Filter by role" hideLabel value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">All roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.code}>
                {role.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>
      {loading ? (
        <SkeletonCards count={6} className="lg:grid-cols-2 xl:grid-cols-3" height="h-64" />
      ) : error ? (
        <LoadError error={error} message="We couldn't load users." onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description={query || roleFilter !== "all" ? "Try a different search or filter." : "No accounts exist yet."} />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((user) => (
            <li key={user.id}>
              <UserCard user={user} roles={roles} isSelf={user.id === me?.id} onChange={(updated) => replace(user.id, updated)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
