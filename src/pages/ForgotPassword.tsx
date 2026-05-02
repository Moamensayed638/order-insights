import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/auth";
import { buildForgotPasswordBody } from "@/lib/forgot-password";
import { AuthShell, AuthCard, AuthField, AuthButton } from "./Login";
import { cn } from "@/lib/utils";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Biscofa — Forgot Password"; }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(apiUrl("Auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildForgotPasswordBody(email)),
      });
      if (!res.ok) throw new Error("Request failed");
      setMessage({ text: "If this email exists, reset instructions were sent.", ok: true });
      window.setTimeout(() => navigate("/reset-password", { replace: true }), 1500);
    } catch {
      setMessage({ text: "Could not send reset request. Please try again.", ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard title="Forgot password" subtitle="Enter your email and we'll send reset instructions.">
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

          <AuthButton loading={loading} label="Send reset email" loadingLabel="Sending…" />

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
