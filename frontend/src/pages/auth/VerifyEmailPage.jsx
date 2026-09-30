import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthFrame from "./AuthFrame.jsx";
import Alert from "../../components/common/Alert.jsx";
import { authService } from "../../services/cyberShieldApi.js";

const messages = {
  verifying: "Verifying your email...",
  verified: "Your email is verified. You can now sign in.",
  failed: "This verification link is invalid or has expired.",
  missing: "No verification token found in this link.",
};

const tones = { verifying: "info", verified: "success", failed: "error", missing: "warning" };

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState(token ? "verifying" : "missing");

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    authService
      .verifyEmail(token)
      .then(() => !cancelled && setState("verified"))
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthFrame title="Email verification" subtitle="Confirming your account email address.">
      <Alert tone={tones[state]}>{messages[state]}</Alert>
      <Link className="mt-5 inline-block text-sm text-cyanx hover:text-sky-200" to="/login">
        Back to sign in
      </Link>
    </AuthFrame>
  );
}
