import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { isClerkConfigured } from "../../auth";
import { DriverSignIn } from "./driver-sign-in";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
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

  const { mode } = await searchParams;
  if (mode === "admin") return <main className="auth-shell admin-auth-shell"><div><Link className="driver-login-back" href="/sign-in">← Login pengemudi</Link><SignIn forceRedirectUrl="/admin" withSignUp={false} /></div></main>;
  return <main className="auth-shell driver-auth-shell"><DriverSignIn /></main>;
}
