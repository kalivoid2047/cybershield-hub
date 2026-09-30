import { useState } from "react";
import { Link } from "react-router-dom";
import AuthFrame from "./AuthFrame.jsx";
import Alert from "../../components/common/Alert.jsx";
import Button from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Field.jsx";
import { authService } from "../../services/cyberShieldApi.js";
import { errorMessage } from "../../utils/errors.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [debugToken, setDebugToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await authService.resetPassword(email);
      // Only present when the API runs in DEBUG (no mail server).
      setDebugToken(response?.debug_password_reset_token || "");
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, "We couldn't send the reset link. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame title="Reset password" subtitle="Request a secure password reset link for your account.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        {error && <Alert tone="error">{error}</Alert>}
        {sent && (
          <Alert tone="success">
            If the account exists, reset instructions were sent.{" "}
            <Link className="font-semibold underline" to={debugToken ? `/reset-password?token=${debugToken}` : "/reset-password"}>
              {debugToken ? "Continue to reset (development shortcut)" : "Enter reset token"}
            </Link>
          </Alert>
        )}
        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? "Sending..." : sent ? "Send again" : "Send reset link"}
        </Button>
      </form>
      <Link className="mt-5 inline-block text-sm text-cyanx hover:text-sky-200" to="/login">
        Back to sign in
      </Link>
    </AuthFrame>
  );
}
