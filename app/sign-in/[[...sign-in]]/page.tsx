import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { isClerkConfigured } from "../../auth";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <span className="eyebrow"><i /> Konfigurasi diperlukan</span>
          <h1>Login admin belum diaktifkan.</h1>
          <p>Hubungkan integrasi Clerk pada project Vercel untuk mengaktifkan portal admin.</p>
          <Link className="button button-primary" href="/">Kembali ke beranda</Link>
        </section>
      </main>
    );
  }

  return <main className="auth-shell"><SignIn forceRedirectUrl="/admin" /></main>;
}
