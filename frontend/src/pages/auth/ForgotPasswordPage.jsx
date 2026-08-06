import { useState } from "react";
import { Link } from "react-router-dom";
import AuthFrame from "./AuthFrame.jsx";
import Button from "../../components/common/Button.jsx";
import { authService } from "../../services/cyberShieldApi.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    await authService.resetPassword(email);
    setSent(true);
  }

  return (
    <AuthFrame title="Reset password" subtitle="Request a secure password reset link for your account.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input className="focus-ring min-h-11 w-full rounded-md border border-white/10 bg-white/7 px-3 text-white" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        {sent && <p className="rounded-md border border-mint/20 bg-mint/10 px-3 py-2 text-sm text-emerald-100">If the account exists, reset instructions were sent.</p>}
        <Button className="w-full" type="submit">
          Send reset link
        </Button>
      </form>
      <Link className="mt-5 inline-block text-sm text-cyanx hover:text-sky-200" to="/login">
        Back to sign in
      </Link>
    </AuthFrame>
  );
}
