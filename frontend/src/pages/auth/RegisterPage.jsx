import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFrame from "./AuthFrame.jsx";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    organization: "",
    department: "",
    password: "",
    password_confirm: "",
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const username = form.username || form.email.split("@")[0];
    await register({ ...form, username });
    setMessage("Account created. Email verification is ready when mail delivery is configured.");
    setTimeout(() => navigate("/login"), 900);
  }

  return (
    <AuthFrame title="Create account" subtitle="Join your organization's cybersecurity readiness workspace.">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <input className="focus-ring min-h-11 rounded-md border border-white/10 bg-white/7 px-3 text-white" placeholder="First name" value={form.first_name} onChange={(event) => update("first_name", event.target.value)} required />
          <input className="focus-ring min-h-11 rounded-md border border-white/10 bg-white/7 px-3 text-white" placeholder="Last name" value={form.last_name} onChange={(event) => update("last_name", event.target.value)} required />
        </div>
        <input className="focus-ring min-h-11 rounded-md border border-white/10 bg-white/7 px-3 text-white" placeholder="Email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
        <input className="focus-ring min-h-11 rounded-md border border-white/10 bg-white/7 px-3 text-white" placeholder="Organization" value={form.organization} onChange={(event) => update("organization", event.target.value)} />
        <input className="focus-ring min-h-11 rounded-md border border-white/10 bg-white/7 px-3 text-white" placeholder="Department" value={form.department} onChange={(event) => update("department", event.target.value)} />
        <input className="focus-ring min-h-11 rounded-md border border-white/10 bg-white/7 px-3 text-white" placeholder="Password" type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required />
        <input className="focus-ring min-h-11 rounded-md border border-white/10 bg-white/7 px-3 text-white" placeholder="Confirm password" type="password" value={form.password_confirm} onChange={(event) => update("password_confirm", event.target.value)} required />
        {message && <p className="rounded-md border border-mint/20 bg-mint/10 px-3 py-2 text-sm text-emerald-100">{message}</p>}
        <Button disabled={loading} type="submit">
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-sm text-slate-400">
        Already registered?{" "}
        <Link className="text-cyanx hover:text-sky-200" to="/login">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
