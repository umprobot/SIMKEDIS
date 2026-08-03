"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Driver, LoanRequest, Vehicle } from "../../db/queries";

type Data = {
  stats: { vehicles: number; available: number; service: number; pending: number; taxDue: number };
  vehicles: Vehicle[];
  requests: LoanRequest[];
  drivers: Driver[];
};

const tabs = ["Ringkasan", "Kendaraan", "Pengemudi", "Permohonan", "Pemeliharaan", "Bahan Bakar", "Jadwal KIR", "Kontak Person"] as const;
type Tab = typeof tabs[number];

export function AdminDashboard({ user, data, signOutPath }: { user: { displayName: string; email: string }; data: Data; signOutPath: string }) {
  const [tab, setTab] = useState<Tab>("Ringkasan");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");

  const filteredVehicles = useMemo(() => data.vehicles.filter((vehicle) => {
    const matchesQuery = `${vehicle.plate_number} ${vehicle.brand} ${vehicle.model} ${vehicle.assignee ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === "Semua" || vehicle.category === category);
  }), [data.vehicles, query, category]);

  async function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/vehicles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const result = await response.json() as { error?: string };
    if (!response.ok) return setNotice(result.error ?? "Data kendaraan gagal disimpan.");
    window.location.reload();
  }

  async function changeVehicleStatus(vehicle: Vehicle, status: string) {
    const response = await fetch(`/api/vehicles/${vehicle.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({
      plateNumber: vehicle.plate_number, brand: vehicle.brand, model: vehicle.model, category: vehicle.category,
      bodyType: vehicle.body_type, year: vehicle.year, assignee: vehicle.assignee, usage: vehicle.usage,
      status, taxDueDate: vehicle.tax_due_date, taxAmount: vehicle.tax_amount,
      plateRenewalYear: vehicle.plate_renewal_year, notes: vehicle.notes,
    }) });
    if (!response.ok) return setNotice("Status kendaraan gagal diperbarui.");
    window.location.reload();
  }

  async function removeVehicle(vehicle: Vehicle) {
    if (!window.confirm(`Hapus ${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})?`)) return;
    const response = await fetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
    if (!response.ok) return setNotice("Kendaraan belum dapat dihapus.");
    window.location.reload();
  }

  async function decideRequest(request: LoanRequest, status: "Disetujui" | "Ditolak") {
    const selector = document.getElementById(`vehicle-${request.id}`) as unknown as { value?: string } | null;
    const vehicleId = status === "Disetujui" ? (selector?.value || null) : null;
    const response = await fetch(`/api/requests/${request.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, vehicleId }) });
    if (!response.ok) return setNotice("Status permohonan belum dapat diperbarui.");
    window.location.reload();
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand admin-brand"><span className="brand-mark">SK</span><span><strong>SIMKEDIS</strong><small>Panel Pengelola</small></span></div>
        <nav>{tabs.map((item, index) => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}><span>{["▦", "▱", "♙", "▣", "⌁", "▤", "▣", "☎"][index]}</span>{item === "Ringkasan" ? "Dashboard" : item}{item === "Permohonan" && data.stats.pending > 0 && <b>{data.stats.pending}</b>}</button>)}</nav>
        <div className="sidebar-help"><span>?</span><strong>Butuh bantuan?</strong><p>Gunakan data terverifikasi sebelum ditampilkan pada layanan publik.</p></div>
        <a className="sidebar-signout" href={signOutPath}>Keluar dari admin <span>↗</span></a>
      </aside>

      <section className="admin-content">
        <header className="admin-header"><div><p>Panel administrasi</p><h1>{tab}</h1></div><div className="admin-user"><span>{user.displayName.slice(0, 2).toUpperCase()}</span><div><strong>{user.displayName}</strong><small>{user.email}</small></div></div></header>
        {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}

        {tab === "Ringkasan" && <Overview data={data} onOpenRequests={() => setTab("Permohonan")} />}
        {tab === "Kendaraan" && <section className="admin-section">
          <div className="section-tools"><div><h2>Daftar kendaraan</h2><p>Data armada berdasarkan kategori pada workbook.</p></div><button className="button button-dark" onClick={() => setShowForm(!showForm)}>{showForm ? "Tutup formulir" : "+ Tambah kendaraan"}</button></div>
          {showForm && <VehicleForm onSubmit={addVehicle} />}
          <div className="table-toolbar"><label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari pelat, merek, atau pengguna" /></label><select value={category} onChange={(event) => setCategory(event.target.value)}><option>Semua</option>{[...new Set(data.vehicles.map((v) => v.category))].map((item) => <option key={item}>{item}</option>)}</select><span>{filteredVehicles.length} kendaraan</span></div>
          <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Kendaraan</th><th>Pelat</th><th>Kategori</th><th>Pengguna</th><th>Pajak</th><th>Status</th><th /></tr></thead><tbody>{filteredVehicles.map((vehicle) => <tr key={vehicle.id}><td><strong>{vehicle.brand} {vehicle.model}</strong><small>{vehicle.body_type ?? "—"} · {vehicle.year ?? "—"}</small></td><td><code>{vehicle.plate_number}</code></td><td>{vehicle.category}</td><td>{vehicle.assignee ?? "Belum ditetapkan"}</td><td>{formatDate(vehicle.tax_due_date)}</td><td><select className={`status-select status-${slug(vehicle.status)}`} value={vehicle.status} onChange={(event) => changeVehicleStatus(vehicle, event.target.value)}>{["Tersedia", "Dipakai", "Servis", "Tidak Aktif"].map((status) => <option key={status}>{status}</option>)}</select></td><td><button className="icon-button danger" aria-label={`Hapus ${vehicle.plate_number}`} onClick={() => removeVehicle(vehicle)}>×</button></td></tr>)}</tbody></table></div>
        </section>}
        {tab === "Permohonan" && <RequestsPanel requests={data.requests} vehicles={data.vehicles} onDecision={decideRequest} />}
        {tab === "Pengemudi" && <DriversPanel drivers={data.drivers} />}
        {(["Pemeliharaan", "Bahan Bakar", "Jadwal KIR", "Kontak Person"] as Tab[]).includes(tab) && <section className="admin-section admin-coming-soon"><span>SIMKEDIS</span><h2>Modul {tab}</h2><p>Navigasi sudah disiapkan mengikuti struktur pengelolaan kendaraan dinas. Data operasional modul ini dapat ditambahkan setelah format resminya diverifikasi.</p></section>}
      </section>
    </main>
  );
}

function Overview({ data, onOpenRequests }: { data: Data; onOpenRequests: () => void }) {
  const cards = [["Total armada", data.stats.vehicles, "▣", "Semua kategori"], ["Siap digunakan", data.stats.available, "✓", "Status tersedia"], ["Dalam servis", data.stats.service, "◇", "Perlu pemantauan"], ["Pajak ≤30 hari", data.stats.taxDue, "◷", "Segera ditindaklanjuti"]];
  const upcoming = data.vehicles.filter((v) => v.tax_due_date).sort((a, b) => String(a.tax_due_date).localeCompare(String(b.tax_due_date))).slice(0, 4);
  return <><section className="kpi-grid">{cards.map(([label, value, icon, note]) => <article key={String(label)}><div><span>{icon}</span><small>{note}</small></div><strong>{value}</strong><p>{label}</p></article>)}</section><section className="dashboard-grid"><article className="panel"><div className="panel-heading"><div><h2>Permohonan terbaru</h2><p>Antrean yang perlu ditinjau</p></div><button onClick={onOpenRequests}>Lihat semua →</button></div><div className="request-list">{data.requests.slice(0, 4).map((request) => <div key={request.id}><span className="request-date">{new Date(request.event_date).getDate()}<small>{new Date(request.event_date).toLocaleDateString("id-ID", { month: "short" })}</small></span><div><strong>{request.applicant_name}</strong><p>{request.unit} · {request.destination}</p></div><StatusPill value={request.status} /></div>)}</div></article><article className="panel"><div className="panel-heading"><div><h2>Jatuh tempo pajak</h2><p>Agenda dokumen terdekat</p></div></div><div className="tax-list">{upcoming.map((vehicle) => <div key={vehicle.id}><span>◷</span><div><strong>{vehicle.plate_number}</strong><p>{vehicle.brand} {vehicle.model}</p></div><time>{formatDate(vehicle.tax_due_date)}</time></div>)}</div></article></section><section className="category-bar panel"><div className="panel-heading"><div><h2>Komposisi armada</h2><p>Dikelompokkan sesuai sumber Excel</p></div></div><div className="category-items">{[...new Set(data.vehicles.map((v) => v.category))].map((item) => { const count = data.vehicles.filter((v) => v.category === item).length; return <div key={item}><span><strong>{item}</strong><small>{count} kendaraan</small></span><i><b style={{ width: `${Math.max(12, count / Math.max(1, data.stats.vehicles) * 100)}%` }} /></i></div>})}</div></section></>;
}

function RequestsPanel({ requests, vehicles, onDecision }: { requests: LoanRequest[]; vehicles: Vehicle[]; onDecision: (request: LoanRequest, status: "Disetujui" | "Ditolak") => void }) {
  return <section className="admin-section"><div className="section-tools"><div><h2>Permohonan kendaraan</h2><p>Verifikasi jadwal, tujuan, dan tetapkan armada.</p></div><span className="count-badge">{requests.length} permohonan</span></div><div className="requests-grid">{requests.map((request) => <article className="request-admin-card" key={request.id}><div className="request-admin-top"><div><code>{request.id}</code><h3>{request.applicant_name}</h3><p>{request.unit}</p></div><StatusPill value={request.status} /></div><dl><div><dt>Jadwal</dt><dd>{formatDate(request.event_date)} · {request.event_time}</dd></div><div><dt>Tujuan</dt><dd>{request.destination}</dd></div><div><dt>Keperluan</dt><dd>{request.purpose}</dd></div></dl>{request.status === "Menunggu Persetujuan" && <div className="request-actions"><select id={`vehicle-${request.id}`} defaultValue=""><option value="">Pilih kendaraan (opsional)</option>{vehicles.filter((v) => v.status === "Tersedia").map((v) => <option value={v.id} key={v.id}>{v.plate_number} · {v.brand} {v.model}</option>)}</select><div><button className="button approve" onClick={() => onDecision(request, "Disetujui")}>Setujui</button><button className="button reject" onClick={() => onDecision(request, "Ditolak")}>Tolak</button></div></div>}</article>)}</div></section>;
}

function DriversPanel({ drivers }: { drivers: Driver[] }) {
  return <section className="admin-section"><div className="section-tools"><div><h2>Daftar pengemudi</h2><p>Status pengemudi dan kendaraan yang sedang ditangani.</p></div><button className="button button-dark" disabled>+ Tambah pengemudi</button></div><div className="driver-grid">{drivers.map((driver) => <article key={driver.id}><span>{driver.name.slice(-1)}</span><div><h3>{driver.name}</h3><p>{driver.assigned_vehicle ?? "Belum ada kendaraan"}</p></div><StatusPill value={driver.status} /></article>)}</div><p className="data-note">Modul pengemudi sudah mengikuti kolom workbook. Penambahan dan nomor kontak dapat diaktifkan setelah data resmi diverifikasi.</p></section>;
}

function VehicleForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="vehicle-form" onSubmit={onSubmit}><label><span>Nomor polisi</span><input name="plateNumber" required /></label><label><span>Merek</span><input name="brand" required /></label><label><span>Model/tipe</span><input name="model" required /></label><label><span>Kategori</span><select name="category" required>{["Roda Dua", "Kendaraan Jabatan", "Layanan Tamu", "Operasional Biro"].map((v) => <option key={v}>{v}</option>)}</select></label><label><span>Jenis</span><input name="bodyType" placeholder="Sedan, Mini Bus…" /></label><label><span>Tahun</span><input name="year" type="number" min="1900" max="2100" /></label><label><span>Pengguna/unit</span><input name="assignee" /></label><label><span>Jatuh tempo pajak</span><input name="taxDueDate" type="date" /></label><label><span>Status</span><select name="status">{["Tersedia", "Dipakai", "Servis", "Tidak Aktif"].map((v) => <option key={v}>{v}</option>)}</select></label><label className="wide"><span>Keterangan</span><input name="notes" /></label><button className="button button-primary">Simpan kendaraan</button></form>;
}

function StatusPill({ value }: { value: string }) { return <span className={`status-pill status-${slug(value)}`}><i />{value}</span>; }
function slug(value: string) { return value.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""); }
function formatDate(value: string | null) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Belum diisi"; }
