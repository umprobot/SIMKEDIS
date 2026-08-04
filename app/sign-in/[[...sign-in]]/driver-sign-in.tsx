"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";

export function DriverSignIn() {
  const { signIn, fetchStatus } = useSignIn();
  const [message, setMessage] = useState("");
  const [pendingFinalize, setPendingFinalize] = useState(false);
  const finalizing = useRef(false);

  useEffect(() => {
    if (!pendingFinalize || signIn.status !== "complete" || finalizing.current) return;
    finalizing.current = true;

    void signIn.finalize().then(({ error }) => {
      if (error) throw error;
      window.location.assign("/admin");
    }).catch(() => {
        finalizing.current = false;
        setPendingFinalize(false);
        setMessage("Login diterima, tetapi sesi belum dapat dibuat. Silakan coba kembali.");
    });
  }, [pendingFinalize, signIn]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    try {
      const { error } = await signIn.password({ emailAddress: `${username}@driver.simkedis.vercel.app`, password });
      if (error) {
        const code = error.code;
        if (code === "form_password_compromised" || code === "form_password_pwned") return setMessage("Password lama tidak aman. Hubungi admin untuk melakukan reset password.");
        return setMessage("Username atau password tidak sesuai.");
      }
      setPendingFinalize(true);
    } catch {
      setMessage("Username atau password tidak sesuai.");
    }
  }

  return <section className="driver-login-card"><div className="login-brand"><span className="brand-mark">SK</span><div><strong>SIMKEDIS</strong><small>Portal Pengemudi</small></div></div><span className="section-badge">Akses operasional</span><h1>Masuk sebagai pengemudi</h1><p>Gunakan nama singkat dan password yang diberikan pengelola.</p><form onSubmit={submit}><label><span>Username</span><input name="username" required autoComplete="username" autoCapitalize="none" placeholder="contoh: budi" /></label><label><span>Password</span><input name="password" type="password" required autoComplete="current-password" placeholder="Masukkan password" /></label>{message && <div className="login-error" role="alert">{message}</div>}<button className="button modal-save" disabled={fetchStatus === "fetching"}>{fetchStatus === "fetching" ? "Memeriksa..." : "Masuk"}</button></form><Link className="admin-login-link" href="/sign-in?mode=admin">Masuk sebagai administrator →</Link></section>;
}
