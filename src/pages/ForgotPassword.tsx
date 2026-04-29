import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/auth";
import { buildForgotPasswordBody } from "@/lib/forgot-password";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(apiUrl("Auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildForgotPasswordBody(email)),
      });
      if (!res.ok) throw new Error("Request failed");
      setMessage("If the email exists, reset instructions were sent.");
      window.setTimeout(() => navigate("/reset-password", { replace: true }), 1200);
    } catch {
      setMessage("Could not send reset request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-surface p-4">
      <Card className="w-full max-w-md space-y-4 p-6 shadow-soft">
        <div>
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-sm text-muted-foreground">Enter your email to receive reset instructions.</p>
        </div>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          <Button className="w-full" disabled={loading}>{loading ? "Sending..." : "Send reset email"}</Button>
        </form>
      </Card>
    </div>
  );
}
