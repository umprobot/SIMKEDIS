import Link from "next/link";
import { getPublicData } from "../db/queries";
import { PublicRequestForm } from "./components/PublicRequestForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getPublicData().catch(() => ({ stats: { vehicles: 68, available: 0, pending: 0 }, vehicles: [], drivers: [] }));

  return (
    <main className="public-shell">
      <header className="public-nav">
        <Link className="brand" href="/" aria-label="Beranda SIMKEDIS">
          <span className="brand-mark"><b>DIY</b></span>
          <span><strong>SIMKEDIS</strong><small>KENDARAAN DINAS</small></span>
        </Link>
        <nav aria-label="Navigasi utama">
          <a href="#peminjaman">Ajukan Peminjaman</a>
          <a href="#driver">Driver Tersedia</a>
          <a href="#kontak">Kontak</a>
          <Link className="admin-link" href="/admin"><span>♢</span> Admin</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">♢ Portal Layanan Publik</span>
          <h1>Sistem Informasi Kendaraan<br />Dinas</h1>
          <p>Ajukan peminjaman kendaraan dinas, lihat pengemudi yang tersedia, dan hubungi pengelola dengan mudah secara online.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#peminjaman">Ajukan Peminjaman <span>→</span></a>
            <a className="button button-outline" href="#driver">Lihat Driver Tersedia</a>
          </div>
        </div>
      </section>

      <section className="feature-strip" aria-label="Keunggulan layanan">
        <article><span className="feature-icon">▣</span><div><strong>Peminjaman Online</strong><p>Ajukan penggunaan kendaraan dinas kapan saja tanpa antre.</p></div></article>
        <article><span className="feature-icon">♙</span><div><strong>Driver Tersedia</strong><p>Lihat daftar pengemudi yang siap bertugas hari ini.</p></div></article>
        <article><span className="feature-icon">◴</span><div><strong>Transparan</strong><p>Status pengajuan dapat dilacak secara real-time.</p></div></article>
      </section>

      <section className="request-section" id="peminjaman">
        <div className="section-heading centered"><span className="section-badge">▣ Form Peminjaman</span><h2>Ajukan Peminjaman Kendaraan</h2><p>Ajukan kendaraan dinas melalui formulir berikut. Pengajuan akan ditinjau oleh admin.</p></div>
        <PublicRequestForm vehicles={data.vehicles} drivers={data.drivers} />
      </section>

      <section className="drivers-section" id="driver">
        <div className="section-heading centered"><span className="section-badge blue">♙ Driver Tersedia</span><h2>Pengemudi Siap Bertugas</h2><p>Daftar pengemudi yang aktif dan tersedia untuk dinas.</p></div>
        <div className="public-driver-grid">
          {data.drivers.length ? data.drivers.map((driver) => <article className="public-driver-card" key={driver.id}><div className="driver-main"><span className="driver-avatar">{driver.name.charAt(0)}</span><div><h3>{driver.name}</h3><p>{driver.assigned_vehicle ?? "Driver Pool Kendaraan"}</p><span className="availability">Aktif</span></div></div><div className="driver-meta"><span>Unit: Biro Umum dan Protokol</span><span>☎ {driver.phone ?? "Kontak melalui admin"}</span></div></article>) : <article className="empty-public-card"><strong>Pengemudi sedang bertugas</strong><p>Silakan hubungi admin untuk informasi ketersediaan terbaru.</p></article>}
        </div>
      </section>

      <section className="contact-section" id="kontak">
        <div className="section-heading centered"><span className="section-badge neutral">☎ Kontak Person</span><h2>Hubungi Pengelola</h2><p>Ada pertanyaan? Tim kami siap membantu Anda.</p></div>
        <a className="whatsapp-card" href="https://wa.me/62897979767" target="_blank" rel="noreferrer"><span className="wa-icon">◔</span><div><strong>Admin Pool Kendaraan</strong><small>Chat via WhatsApp · 0897-9797-67</small></div><b>→</b></a>
        <div className="contact-grid">
          <article><span>☎</span><small>TELEPON</small><strong>(0274) 562811</strong></article>
          <article><span>✉</span><small>EMAIL</small><strong>inovasibiroup@gmail.com</strong></article>
          <article><span>⌖</span><small>ALAMAT</small><strong>Kompleks Kepatihan, Yogyakarta</strong></article>
          <article><span>◷</span><small>JAM LAYANAN</small><strong>08.00 - 16.00 WIB</strong></article>
        </div>
      </section>

      <footer><div className="brand footer-brand"><span className="brand-mark"><b>DIY</b></span><span><strong>SIMKEDIS</strong><small>KENDARAAN DINAS</small></span></div><p>© 2026 SIMKEDIS. Layanan pengelolaan kendaraan dinas.</p><Link href="/admin">Portal Admin →</Link></footer>
    </main>
  );
}
