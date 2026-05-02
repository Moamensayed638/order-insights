import { type ReactNode, FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Package, Phone, Lock } from "lucide-react";
import { apiUrl, clearToken, extractToken, getStoredToken, storeToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword]       = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    document.title = "Biscofa — Sign In";
    if (getStoredToken()) navigate("/adminorders", { replace: true });
  }, [navigate]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      clearToken();
      const res = await fetch(apiUrl("Auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });
      const data = await res.json().catch(() => null);
      const token = extractToken(data);
      if (!res.ok || !token) throw new Error("Invalid login response");
      storeToken(token);
      navigate("/adminorders", { replace: true });
    } catch {
      setError("Invalid phone number or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to your admin console"
        icon={<Package className="h-5 w-5 text-primary-foreground" />}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <AuthField
            icon={<Phone className="h-4 w-4" />}
            label="Phone number"
            type="tel"
            value={phoneNumber}
            onChange={setPhoneNumber}
            placeholder="+20 1xx xxx xxxx"
            autoComplete="tel"
          />

          <AuthField
            icon={<Lock className="h-4 w-4" />}
            label="Password"
            type={showPass ? "text" : "password"}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            suffix={
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {error && (
            <p className="text-xs font-mono text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <AuthButton loading={loading} label="Sign in" loadingLabel="Signing in…" />

          <p className="text-center text-xs text-muted-foreground pt-1">
            <Link
              to="/forgot-password"
              className="underline underline-offset-4 decoration-muted-foreground/40 hover:text-foreground hover:decoration-primary transition-colors"
            >
              Forgot your password?
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}

/* ── Shared layout pieces ── */

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full bg-accent/4 blur-[100px]" />
      </div>

      {/* Grid lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(38 50% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(38 50% 50%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        {/* Brand mark */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Package className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-foreground leading-none">Biscofa</p>
            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground leading-none mt-0.5">
              Admin Console
            </p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

export function AuthCard({
  title, subtitle, icon, children,
}: {
  title: string; subtitle: string; icon?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="panel rounded-xl p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function AuthField({
  icon, label, type, value, onChange, placeholder, autoComplete, suffix,
}: {
  icon: ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  suffix?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-muted-foreground/60">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className={cn(
            "w-full rounded-md border border-border/60 bg-muted/30 px-3 py-2.5 pl-9 text-sm text-foreground",
            "placeholder:text-muted-foreground/40 font-body",
            "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
            "transition-colors duration-200",
            suffix && "pr-10"
          )}
        />
        {suffix && (
          <span className="absolute right-3">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export function AuthButton({
  loading, label, loadingLabel,
}: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "w-full rounded-md bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground",
        "shadow-elegant hover:opacity-90 active:scale-[0.98] transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/40",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2"
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? loadingLabel : label}
    </button>
  );
}
