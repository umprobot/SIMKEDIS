"use client";

import { FormEvent, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";

export function DriverSignIn() {
  const clerk = useClerk();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    setIsSubmitting(true);
    try {
      const result = await clerk.client.signIn.create({
        identifier: `${username}@driver.simkedis.vercel.app`,
        password,
      });
      if (result.status !== "complete" || !result.createdSessionId) {
        return setMessage("Login diterima, tetapi sesi belum dapat dibuat. Silakan coba kembali.");
      }
      await clerk.setActive({ session: result.createdSessionId });
      window.location.assign("/admin");
    } catch (error) {
      const code = typeof error === "object" && error !== null && "errors" in error
        ? (error as { errors?: Array<{ code?: string }> }).errors?.[0]?.code
        : undefined;
      if (code === "form_password_compromised" || code === "form_password_pwned") {
        return setMessage("Password lama tidak aman. Hubungi admin untuk melakukan reset password.");
      }
      setMessage("Username atau password tidak sesuai.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <section className="driver-login-card"><div className="login-brand"><span className="brand-mark">SK</span><div><strong>SIMKEDIS</strong><small>Portal Pengemudi</small></div></div><span className="section-badge">Akses operasional</span><h1>Masuk sebagai pengemudi</h1><p>Gunakan nama singkat dan password yang diberikan pengelola.</p><form onSubmit={submit}><label><span>Username</span><input name="username" required autoComplete="username" autoCapitalize="none" placeholder="contoh: budi" /></label><label><span>Password</span><input name="password" type="password" required autoComplete="current-password" placeholder="Masukkan password" /></label>{message && <div className="login-error" role="alert">{message}</div>}<button className="button modal-save" disabled={isSubmitting}>{isSubmitting ? "Memeriksa..." : "Masuk"}</button></form><Link className="admin-login-link" href="/sign-in?mode=admin">Masuk sebagai administrator →</Link></section>;
}
