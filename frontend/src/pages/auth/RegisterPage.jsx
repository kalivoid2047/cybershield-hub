import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthFrame from "./AuthFrame.jsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import { Input, PasswordInput } from "../../components/common/Field.jsx";
import PasswordStrength, { passwordMeetsLength } from "../../components/common/PasswordStrength.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { errorMessage, fieldErrors } from "../../utils/errors.js";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
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
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const local = {};
    if (!passwordMeetsLength(form.password)) local.password = "Use at least 10 characters.";
    if (form.password !== form.password_confirm) local.password_confirm = "Passwords do not match.";
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setErrors({});
    const username = form.username || form.email.split("@")[0];
    try {
      await register({ ...form, username });
      setMessage("Account created. Redirecting you to sign in…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const fields = fieldErrors(err);
      setErrors(fields);
      if (!Object.keys(fields).length) setError(errorMessage(err, "We couldn't create your account. Please try again."));
    }
  }

  return (
    <AuthFrame title="Create account" subtitle="Join your organization's cybersecurity readiness workspace.">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" autoComplete="given-name" value={form.first_name} onChange={(event) => update("first_name", event.target.value)} error={errors.first_name} required />
          <Input label="Last name" autoComplete="family-name" value={form.last_name} onChange={(event) => update("last_name", event.target.value)} error={errors.last_name} required />
        </div>
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} error={errors.email || errors.username} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Organization" autoComplete="organization" value={form.organization} onChange={(event) => update("organization", event.target.value)} error={errors.organization} />
          <Input label="Department" value={form.department} onChange={(event) => update("department", event.target.value)} error={errors.department} />
        </div>
        <div className="grid gap-3">
          <PasswordInput label="Password" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} error={errors.password} required />
          <PasswordStrength value={form.password} />
        </div>
        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          value={form.password_confirm}
          onChange={(event) => update("password_confirm", event.target.value)}
          error={errors.password_confirm}
          required
        />
        {error && <Alert tone="error">{error}</Alert>}
        {message && <Alert tone="success">{message}</Alert>}
        <Button disabled={loading || Boolean(message)} type="submit">
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
