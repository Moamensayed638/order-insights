import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { apiUrl } from "@/lib/auth";
import { buildResetPasswordBody } from "@/lib/reset-password";
import { AuthShell, AuthCard, AuthField, AuthButton } from "./Login";
import { cn } from "@/lib/utils";

type ResetPasswordError = {
  description?: string;
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage]       = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading]       = useState(false);
  const email = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const hasValidResetLink = Boolean(email && token);
  const invalidLinkMessage = "This reset link is incomplete. Request a new password reset email.";

  useEffect(() => { document.title = "Biscofa — Reset Password"; }, []);
  useEffect(() => {
    if (!hasValidResetLink) {
      setMessage({ text: invalidLinkMessage, ok: false });
      return;
    }

    setMessage(null);
  }, [hasValidResetLink]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasValidResetLink) {
      setMessage({ text: invalidLinkMessage, ok: false });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(apiUrl("Auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildResetPasswordBody(email, token, newPassword)),
      });
      if (!res.ok) {
        const errorText = await readResetPasswordError(res);
        throw new Error(errorText);
      }

      setMessage({ text: "Password reset successfully! Redirecting to sign in…", ok: true });
      window.setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Could not reset password. Check your token and try again.",
        ok: false,
      });
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
          {hasValidResetLink && (
            <AuthField
              icon={<Lock className="h-4 w-4" />}
              label="New password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
          )}

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

          {hasValidResetLink && <AuthButton loading={loading} label="Reset password" loadingLabel="Resetting…" />}

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

async function readResetPasswordError(response: Response) {
  try {
    const payload = (await response.json()) as ResetPasswordError[] | { message?: string };

    if (Array.isArray(payload)) {
      const descriptions = payload
        .map((item) => item.description?.trim())
        .filter((value): value is string => Boolean(value));

      if (descriptions.length > 0) {
        return descriptions.join(" ");
      }
    }

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {
    // Fall through to the generic message.
  }

  return "Could not reset password. Check your token and try again.";
}
