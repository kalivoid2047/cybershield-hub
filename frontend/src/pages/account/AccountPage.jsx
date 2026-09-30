import { useState } from "react";
import { Laptop, LogOut, Save, ShieldCheck, Smartphone } from "lucide-react";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { Input, PasswordInput } from "../../components/common/Field.jsx";
import LoadError from "../../components/common/LoadError.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import PasswordStrength from "../../components/common/PasswordStrength.jsx";
import { SkeletonRows } from "../../components/common/Skeleton.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { useToast } from "../../components/common/Toast.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import useAsync from "../../hooks/useAsync.js";
import { authService } from "../../services/cyberShieldApi.js";
import { errorMessage, fieldErrors } from "../../utils/errors.js";
import { formatDate } from "../../utils/formatters.js";

function describeDevice(userAgent = "") {
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Browser";
  const os = /Windows/.test(userAgent) ? "Windows" : /Android/.test(userAgent) ? "Android" : /iPhone|iPad/.test(userAgent) ? "iOS" : /Mac OS/.test(userAgent) ? "macOS" : /Linux/.test(userAgent) ? "Linux" : "Unknown device";
  return { label: `${browser} on ${os}`, mobile: /Android|iPhone|iPad/.test(userAgent) };
}

function ProfileCard() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    organization: user?.organization || "",
    department: user?.department || "",
    phone: user?.phone || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const dirty = Object.keys(form).some((key) => form[key] !== (user?.[key] || ""));

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const profile = await authService.updateProfile(form);
      updateUser(profile);
      setErrors({});
      toast.success("Profile updated.");
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error(errorMessage(error, "We couldn't update your profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="font-semibold text-white">Profile</h2>
      <p className="mt-1 text-sm text-slate-400">Your name and organization appear on reports and in the admin directory.</p>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={save}>
        <Input label="First name" autoComplete="given-name" value={form.first_name} onChange={(event) => update("first_name", event.target.value)} error={errors.first_name} required />
        <Input label="Last name" autoComplete="family-name" value={form.last_name} onChange={(event) => update("last_name", event.target.value)} error={errors.last_name} required />
        <Input label="Email" value={user?.email || ""} disabled hint="Contact an administrator to change your sign-in email." wrapperClassName="sm:col-span-2" readOnly />
        <Input label="Organization" autoComplete="organization" value={form.organization} onChange={(event) => update("organization", event.target.value)} error={errors.organization} />
        <Input label="Department" value={form.department} onChange={(event) => update("department", event.target.value)} error={errors.department} />
        <Input label="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} error={errors.phone} wrapperClassName="sm:col-span-2" />
        <div className="flex items-center justify-between gap-3 sm:col-span-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <StatusBadge value={user?.role?.code || "info"} />
            {user?.is_email_verified ? <span className="text-emerald-200">Email verified</span> : <span className="text-amber-100">Email not verified</span>}
          </div>
          <Button type="submit" disabled={!dirty || saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const empty = { current_password: "", password: "", password_confirm: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function save(event) {
    event.preventDefault();
    if (form.password !== form.password_confirm) {
      setErrors({ password_confirm: "Passwords do not match." });
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(form);
      setForm(empty);
      setErrors({});
      toast.success("Password changed.");
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error(errorMessage(error, "We couldn't change your password."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="flex items-center gap-2 font-semibold text-white">
        <ShieldCheck className="h-4 w-4 text-cyanx" aria-hidden="true" />
        Change password
      </h2>
      <form className="mt-5 grid gap-4" onSubmit={save}>
        <PasswordInput label="Current password" autoComplete="current-password" value={form.current_password} onChange={(event) => update("current_password", event.target.value)} error={errors.current_password} required />
        <PasswordInput label="New password" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} error={errors.password} required />
        <PasswordStrength value={form.password} />
        <PasswordInput label="Confirm new password" autoComplete="new-password" value={form.password_confirm} onChange={(event) => update("password_confirm", event.target.value)} error={errors.password_confirm} required />
        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !form.current_password || form.password.length < 10}>
            {saving ? "Updating..." : "Update password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SessionsCard() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => authService.sessions().then((items) => (Array.isArray(items) ? items : [])), []);
  const [busyId, setBusyId] = useState(null);
  const sessions = data || [];
  const activeSessions = sessions.filter((session) => session.active);

  async function revoke(session) {
    setBusyId(session.id);
    try {
      await authService.revokeSession(session.id);
      setData((items) => items.map((item) => (item.id === session.id ? { ...item, active: false, revoked_at: new Date().toISOString() } : item)));
      toast.success("Session signed out.");
    } catch (err) {
      toast.error(errorMessage(err, "We couldn't revoke that session."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <h2 className="font-semibold text-white">Active sessions</h2>
      <p className="mt-1 text-sm text-slate-400">Devices signed in to your account. Sign out any you don't recognise.</p>
      <div className="mt-5">
        {loading ? (
          <SkeletonRows count={3} />
        ) : error ? (
          <LoadError error={error} message="We couldn't load your sessions." onRetry={reload} />
        ) : activeSessions.length === 0 ? (
          <EmptyState icon={Laptop} title="No active sessions" description="Sessions appear here after you sign in." />
        ) : (
          <>
            <ul className="space-y-3">
              {activeSessions.map((session) => {
                const device = describeDevice(session.user_agent);
                const DeviceIcon = device.mobile ? Smartphone : Laptop;
                return (
                  <li key={session.id} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3">
                    <DeviceIcon className="h-5 w-5 shrink-0 text-cyanx" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{device.label}</p>
                      <p className="truncate text-xs text-slate-400">
                        {session.ip_address || "Unknown IP"} · last active {formatDate(session.last_seen_at || session.created_at)}
                      </p>
                    </div>
                    <Button variant="secondary" className="min-h-9 px-3 py-1" disabled={busyId === session.id} onClick={() => revoke(session)} aria-label={`Sign out ${device.label}`}>
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </li>
                );
              })}
            </ul>
            <Alert tone="info" className="mt-4">
              If you sign out the device you're using now, you'll be asked to log in again the next time your access refreshes.
            </Alert>
          </>
        )}
      </div>
    </Card>
  );
}

export default function AccountPage() {
  return (
    <div>
      <PageHeader eyebrow="Your account" title="Account & Security" description="Update your profile, change your password, and review where you're signed in." />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ProfileCard />
          <PasswordCard />
        </div>
        <SessionsCard />
      </div>
    </div>
  );
}
