import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { clearToken, extractToken, getStoredToken, storeToken } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredToken()) navigate("/adminorders", { replace: true });
  }, [navigate]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      clearToken();
      const res = await fetch("/api/Auth/login", {
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
      setError("Login failed. Check admin credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-surface p-4">
      <Card className="w-full max-w-md space-y-4 p-6 shadow-soft">
        <div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to view orders.</p>
        </div>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone number" />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={loading}>{loading ? "Signing in..." : "Login"}</Button>
          <div className="pt-1 text-center text-sm">
            <Link to="/forgot-password" className="text-primary underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
