import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame.jsx";
import Button from "../../components/common/Button.jsx";
import { authService } from "../../services/cyberShieldApi.js";

const inputClass = "focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 px-3 text-white";

function firstError(error) {
  const data = error.response?.data;
  const details = data?.errors || data?.error?.details || data;
  if (details && typeof details === "object") {
    const value = Object.values(details).flat()[0];
    if (typeof value === "string") return value;
  }
  return "Password reset failed. Check the token and try again.";
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await authService.confirmPasswordReset({ token: token.trim(), password, password_confirm: passwordConfirm });
      setDone(true);
    } catch (err) {
      setError(firstError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame title="Choose a new password" subtitle="Enter the reset token from your email and set a new password (10+ characters).">
      {done ? (
        <p className="rounded-md border border-mint/20 bg-mint/10 px-3 py-2 text-sm text-emerald-100">
          Password updated.{" "}
          <Link className="font-semibold underline" to="/login">
            Sign in
          </Link>
        </p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input className={inputClass} placeholder="Reset token" value={token} onChange={(event) => setToken(event.target.value)} required />
          <input className={inputClass} placeholder="New password" type="password" minLength={10} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <input className={inputClass} placeholder="Confirm new password" type="password" minLength={10} autoComplete="new-password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} required />
          {error && <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Reset password"}
          </Button>
        </form>
      )}
      <Link className="mt-5 inline-block text-sm text-cyanx hover:text-sky-200" to="/login">
        Back to sign in
      </Link>
    </AuthFrame>
  );
}
