import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, Lock, Mail } from "lucide-react";
import AuthFrame from "./AuthFrame.jsx";
import Button from "../../components/common/Button.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "admin@cybershield.local", password: "CyberShield123!" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || "Login failed.");
    }
  }

  return (
    <AuthFrame title="Sign in" subtitle="Access the SOC dashboard, awareness training, incident reporting, and analytics workspace.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 pl-10 pr-3 text-white placeholder:text-slate-500"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 px-10 text-white placeholder:text-slate-500"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            <Eye className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </span>
        </label>
        {error && <p className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-rose-100">{error}</p>}
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link className="text-cyanx hover:text-sky-200" to="/forgot-password">
          Reset password
        </Link>
        <Link className="text-slate-300 hover:text-white" to="/register">
          Create account
        </Link>
      </div>
    </AuthFrame>
  );
}
