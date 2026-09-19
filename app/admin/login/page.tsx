"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/src/components/brand-mark";
import { SiteFooter } from "@/src/components/site-footer";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    if (response.ok) window.location.href = "/admin";
    else { const body = await response.json().catch(() => ({})); setError(body.error ?? "We could not sign you in."); setBusy(false); }
  };
  return <main className="auth-shell"><div className="auth-card"><Link className="brand" href="/"><BrandMark /><span className="brand-sub">Check-ins</span></Link><div className="eyebrow">Private workspace</div><h1>Welcome back.</h1><p className="muted">Sign in to manage assessments, contacts and reports for Absolute Mind.</p><form onSubmit={submit}><div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required /></div><div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in →"}</button></form></div><SiteFooter /></main>;
}
