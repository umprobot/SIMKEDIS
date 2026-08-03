import Link from "next/link";
import { getPublicStats } from "../db/queries";
import { PublicRequestForm } from "./components/PublicRequestForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stats = await getPublicStats().catch(() => ({ vehicles: 68, available: 0, pending: 0 }));

  return (
    <main className="public-shell">
      <header className="public-nav">
        <Link className="brand" href="/" aria-label="Beranda SIMKEDIS">
          <span className="brand-mark">SK</span>
          <span><strong>SIMKEDIS</strong><small>Sistem Informasi Kendaraan Dinas</small></span>
        </Link>
        <nav aria-label="Navigasi utama">
          <a href="#layanan">Layanan</a>
          <a href="#alur">Alur</a>
          <a href="#kontak">Kontak</a>
        </nav>
        <Link className="button button-ghost" href="/admin">Masuk Admin <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><i /> Layanan kendaraan dinas terintegrasi</span>
          <h1>Mobilitas dinas,<br /><em>lebih tertib.</em></h1>
          <p>Kelola armada, permohonan kendaraan, pajak, dan kesiapan operasional dalam satu layanan yang mudah dipantau.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#permohonan">Ajukan kendaraan <span>→</span></a>
            <a className="text-link" href="#alur">Lihat cara kerja <span>↓</span></a>
          </div>
        </div>
        <div className="hero-panel" aria-label="Ringkasan armada">
          <div className="route-map" aria-hidden="true"><i className="route route-a" /><i className="route route-b" /><b className="pin pin-a" /><b className="pin pin-b" /><b className="pin pin-c" /></div>
          <div className="fleet-card">
            <span className="fleet-icon">↗</span>
            <div><small>Armada tercatat</small><strong>{stats.vehicles}</strong><span>kendaraan lintas kategori</span></div>
          </div>
          <div className="mini-status"><i /> Sistem aktif <span>Diperbarui otomatis</span></div>
        </div>
      </section>

      <section className="public-stats" aria-label="Statistik layanan">
        <article><span>01</span><strong>{stats.vehicles}</strong><p>Total armada tercatat</p></article>
        <article><span>02</span><strong>{stats.available}</strong><p>Kendaraan siap digunakan</p></article>
        <article><span>03</span><strong>{stats.pending}</strong><p>Permohonan menunggu</p></article>
        <article><span>04</span><strong>4</strong><p>Kategori pengelolaan</p></article>
      </section>

      <section className="service-section" id="layanan">
        <div className="section-heading"><span className="eyebrow"><i /> Cakupan layanan</span><h2>Satu sistem untuk seluruh <em>siklus armada.</em></h2></div>
        <div className="service-grid">
          {[
            ["01", "Data armada", "Inventaris kendaraan roda dua, kendaraan jabatan, layanan tamu, dan operasional biro."],
            ["02", "Peminjaman", "Permohonan tercatat rapi dengan status persetujuan yang dapat dipantau."],
            ["03", "Pajak & dokumen", "Pengingat jatuh tempo pajak dan pembaruan pelat agar tidak terlewat."],
            ["04", "Kesiapan operasional", "Pantau status kendaraan, penanggung jawab, pengemudi, dan jadwal servis."],
          ].map(([number, title, body]) => <article className="service-card" key={number}><span>{number}</span><div className="service-symbol" aria-hidden="true">{number === "01" ? "▣" : number === "02" ? "↗" : number === "03" ? "◷" : "◇"}</div><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="flow-section" id="alur">
        <div><span className="eyebrow light"><i /> Alur permohonan</span><h2>Tiga langkah,<br />tanpa berbelit.</h2><p>Permohonan masuk langsung ke meja admin untuk diverifikasi dan ditentukan armadanya.</p></div>
        <ol>
          <li><span>01</span><div><strong>Isi permohonan</strong><p>Lengkapi unit, jadwal, tujuan, dan kebutuhan perjalanan.</p></div></li>
          <li><span>02</span><div><strong>Verifikasi admin</strong><p>Admin memeriksa jadwal dan ketersediaan kendaraan.</p></div></li>
          <li><span>03</span><div><strong>Konfirmasi</strong><p>Status disetujui atau ditolak tercatat untuk tindak lanjut.</p></div></li>
        </ol>
      </section>

      <section className="request-section" id="permohonan">
        <div className="request-intro"><span className="eyebrow"><i /> Formulir layanan</span><h2>Ajukan kendaraan <em>dinas.</em></h2><p>Gunakan formulir ini untuk mencatat kebutuhan perjalanan. Pastikan jadwal dan tujuan sudah benar sebelum dikirim.</p><div className="privacy-note"><strong>Privasi terjaga</strong><span>Data permohonan hanya dapat dibaca dan diproses oleh admin.</span></div></div>
        <PublicRequestForm />
      </section>

      <footer id="kontak">
        <div className="brand footer-brand"><span className="brand-mark">SK</span><span><strong>SIMKEDIS</strong><small>Sistem Informasi Kendaraan Dinas</small></span></div>
        <p>Layanan pengelolaan kendaraan dinas yang lebih tertib, terukur, dan akuntabel.</p>
        <Link href="/admin">Portal admin →</Link>
      </footer>
    </main>
  );
}
