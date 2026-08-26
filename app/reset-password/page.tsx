"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useTurnstile } from "@/components/Turnstile";

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input required minLength={8} type={visible ? "text" : "password"} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 pr-11 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20" />
      <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center text-muted-foreground hover:text-primary">
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { containerRef: turnstileRef, execute: executeTurnstile } = useTurnstile("reset-password");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    if (password !== confirm) return setError("Passwords do not match.");
    setSaving(true);
    try {
      const token = new URLSearchParams(window.location.search).get("token");
      const turnstileToken = await executeTurnstile();
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password, "cf-turnstile-response": turnstileToken }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not reset password.");
      setStatus("Password reset successfully. You can sign in now.");
      setPassword("");
      setConfirm("");
    } catch (requestError) {
      setError((requestError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-12 grid-dots">
      <section className="bento-card w-full max-w-sm p-8">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-background"><KeyRound size={18} /></div>
        <h1 className="display-title text-3xl font-bold text-foreground">Set new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose a new password for your admin account.</p>
        <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
          <div ref={turnstileRef} aria-hidden="true" />
          <PasswordInput placeholder="New password" value={password} onChange={setPassword} />
          <PasswordInput placeholder="Confirm password" value={confirm} onChange={setConfirm} />
          {error && <p className="rounded-lg border border-red-500/50 bg-red-900/30 p-3 text-center text-xs text-red-400">{error}</p>}
          {status && <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-center text-xs text-primary">{status}</p>}
          <button disabled={saving} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-wider text-background disabled:cursor-not-allowed disabled:opacity-50"><KeyRound size={14} /> {saving ? "Saving..." : "Reset password"}</button>
        </form>
        <Link href="/console" className="mt-5 block text-center font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary">Back to console</Link>
      </section>
    </main>
  );
}
