import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame.jsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import { Input, PasswordInput } from "../../components/common/Field.jsx";
import PasswordStrength from "../../components/common/PasswordStrength.jsx";
import { authService } from "../../services/cyberShieldApi.js";
import { errorMessage } from "../../utils/errors.js";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setConfirmError("");
    if (password !== passwordConfirm) {
      setConfirmError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await authService.confirmPasswordReset({ token: token.trim(), password, password_confirm: passwordConfirm });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err, "Password reset failed. Check the token and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame title="Choose a new password" subtitle="Enter the reset token from your email and set a new password (10+ characters).">
      {done ? (
        <Alert tone="success">
          Password updated.{" "}
          <Link className="font-semibold underline" to="/login">
            Sign in
          </Link>
        </Alert>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Reset token" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="off" required />
          <PasswordInput label="New password" minLength={10} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <PasswordStrength value={password} />
          <PasswordInput
            label="Confirm new password"
            minLength={10}
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            error={confirmError}
            required
          />
          {error && <Alert tone="error">{error}</Alert>}
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
