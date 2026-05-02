import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock, ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/auth";
import { buildResetPasswordBody } from "@/lib/reset-password";
import { AuthShell, AuthCard, AuthField, AuthButton } from "./Login";
import { cn } from "@/lib/utils";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail]           = useState("");
  const [token, setToken]           = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage]       = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading]       = useState(false);

  useEffect(() => { document.title = "Biscofa — Reset Password"; }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(apiUrl("Auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildResetPasswordBody(email, token, newPassword)),
      });
      if (!res.ok) throw new Error("Request failed");
      setMessage({ text: "Password reset successfully! Redirecting to sign in…", ok: true });
      window.setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch {
      setMessage({ text: "Could not reset password. Check your token and try again.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard
        title="Reset password"
        subtitle={`Create a new password${email ? ` for ${email}` : " for your account"}.`}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <AuthField
            icon={<Mail className="h-4 w-4" />}
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="admin@biscofa.com"
            autoComplete="email"
          />
          <AuthField
            icon={<KeyRound className="h-4 w-4" />}
            label="Reset token"
            type="text"
            value={token}
            onChange={setToken}
            placeholder="Paste your reset token"
            autoComplete="one-time-code"
          />
          <AuthField
            icon={<Lock className="h-4 w-4" />}
            label="New password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
          />

          {message && (
            <p className={cn(
              "text-xs font-mono rounded-md border px-3 py-2",
              message.ok
                ? "text-accent border-accent/20 bg-accent/10"
                : "text-destructive border-destructive/20 bg-destructive/10"
            )}>
              {message.text}
            </p>
          )}

          <AuthButton loading={loading} label="Reset password" loadingLabel="Resetting…" />

          <p className="text-center text-xs text-muted-foreground pt-1">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 underline underline-offset-4 decoration-muted-foreground/40 hover:text-foreground hover:decoration-primary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to sign in
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
