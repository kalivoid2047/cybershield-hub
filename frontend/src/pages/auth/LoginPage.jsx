import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import AuthFrame from "./AuthFrame.jsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import { Input, PasswordInput } from "../../components/common/Field.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { errorMessage } from "../../utils/errors.js";

// Demo credentials are only prefilled for local development against the seed data.
const initialForm = import.meta.env.DEV ? { email: "admin@cybershield.local", password: "CyberShield123!" } : { email: "", password: "" };

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Login failed. Check your email and password."));
    }
  }

  return (
    <AuthFrame title="Sign in" subtitle="Access the SOC dashboard, awareness training, incident reporting, and analytics workspace.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="username"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <PasswordInput
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />
        {error && <Alert tone="error">{error}</Alert>}
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
