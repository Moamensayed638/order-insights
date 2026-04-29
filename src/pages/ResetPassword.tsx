import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildResetPasswordBody } from "@/lib/reset-password";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/Auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildResetPasswordBody(email, token, newPassword)),
      });
      if (!res.ok) throw new Error("Request failed");
      setMessage("Password reset successfully.");
      window.setTimeout(() => navigate("/login", { replace: true }), 1200);
    } catch {
      setMessage("Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-surface p-4">
      <Card className="w-full max-w-md space-y-4 p-6 shadow-soft">
        <div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-muted-foreground">Create a new password for {email || "your account"}.</p>
        </div>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Reset token" />
          <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" type="password" />
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <Button className="w-full" disabled={loading}>{loading ? "Resetting..." : "Reset password"}</Button>
        </form>
      </Card>
    </div>
  );
}
