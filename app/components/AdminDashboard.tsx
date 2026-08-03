"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Driver, FuelRecord, LoanRequest, MaintenanceRecord, Vehicle } from "../../db/queries";

type Data = {
  stats: { vehicles: number; available: number; service: number; pending: number; taxDue: number };
  vehicles: Vehicle[];
  requests: LoanRequest[];
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
  fuelRecords: FuelRecord[];
};

const tabs = ["Ringkasan", "Kendaraan", "Pengemudi", "Permohonan", "Pemeliharaan", "Bahan Bakar", "Jadwal KIR", "Kontak Person"] as const;
type Tab = typeof tabs[number];

export function AdminDashboard({ user, data, signOutPath }: { user: { displayName: string; email: string }; data: Data; signOutPath: string }) {
  const [tab, setTab] = useState<Tab>("Ringkasan");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [showForm, setShowForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
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

  async function addDriver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/drivers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const result = await response.json() as { error?: string };
    if (!response.ok) return setNotice(result.error ?? "Data pengemudi gagal disimpan.");
    setShowDriverForm(false);
    window.location.reload();
  }

  async function addMaintenance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/maintenance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const result = await response.json() as { error?: string };
    if (!response.ok) return setNotice(result.error ?? "Data pemeliharaan gagal disimpan.");
    setShowMaintenanceForm(false);
    window.location.reload();
  }

  async function addFuel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/fuel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    const result = await response.json() as { error?: string };
    if (!response.ok) return setNotice(result.error ?? "Data pengisian BBM gagal disimpan.");
    setShowFuelForm(false);
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
        {tab === "Pengemudi" && <DriversPanel drivers={data.drivers} onAdd={() => setShowDriverForm(true)} />}
        {tab === "Pemeliharaan" && <MaintenancePanel records={data.maintenance} onAdd={() => setShowMaintenanceForm(true)} />}
        {tab === "Bahan Bakar" && <FuelPanel records={data.fuelRecords} onAdd={() => setShowFuelForm(true)} />}
        {(["Jadwal KIR", "Kontak Person"] as Tab[]).includes(tab) && <section className="admin-section admin-coming-soon"><span>SIMKEDIS</span><h2>Modul {tab}</h2><p>Navigasi sudah disiapkan mengikuti struktur pengelolaan kendaraan dinas. Data operasional modul ini dapat ditambahkan setelah format resminya diverifikasi.</p></section>}
      </section>
      {showDriverForm && <DriverModal onClose={() => setShowDriverForm(false)} onSubmit={addDriver} />}
      {showMaintenanceForm && <MaintenanceModal vehicles={data.vehicles} onClose={() => setShowMaintenanceForm(false)} onSubmit={addMaintenance} />}
      {showFuelForm && <FuelModal vehicles={data.vehicles} onClose={() => setShowFuelForm(false)} onSubmit={addFuel} />}
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

function DriversPanel({ drivers, onAdd }: { drivers: Driver[]; onAdd: () => void }) {
  return <section className="admin-section"><div className="section-tools"><div><h2>Daftar pengemudi</h2><p>Data identitas, SIM, dan status pengemudi kendaraan dinas.</p></div><button className="button button-dark" onClick={onAdd}>+ Tambah Pengemudi</button></div><div className="driver-grid">{drivers.map((driver) => <article key={driver.id}><span>{driver.name.charAt(0)}</span><div><h3>{driver.name}</h3><p>{driver.position ?? "Pengemudi"} · {driver.unit ?? driver.assigned_vehicle ?? "Belum ada unit"}</p><small>{driver.license_type ? `${driver.license_type}${driver.license_expiry ? ` · berlaku s.d. ${formatDate(driver.license_expiry)}` : ""}` : "SIM belum dicatat"}</small></div><StatusPill value={driver.status} /></article>)}</div>{drivers.length === 0 && <p className="data-note">Belum ada data pengemudi. Gunakan tombol Tambah Pengemudi untuk membuat data pertama.</p>}</section>;
}

function DriverModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="driver-modal" role="dialog" aria-modal="true" aria-labelledby="driver-modal-title"><header><h2 id="driver-modal-title">Tambah Pengemudi</h2><button type="button" onClick={onClose} aria-label="Tutup formulir">×</button></header><form onSubmit={onSubmit}><div className="driver-form-grid"><label><span>Nama *</span><input name="name" required autoFocus placeholder="Budi Santoso" /></label><label><span>NIP</span><input name="nip" inputMode="numeric" placeholder="19850101 201001 1 001" /></label><label><span>Jabatan</span><input name="position" placeholder="Analis" /></label><label><span>Unit Kerja</span><input name="unit" placeholder="Bagian Umum" /></label><label><span>No. SIM</span><input name="licenseNumber" /></label><label><span>Jenis SIM</span><select name="licenseType" defaultValue="SIM B1"><option>SIM A</option><option>SIM B1</option><option>SIM B2</option><option>SIM C</option></select></label><label><span>Berlaku SIM</span><input name="licenseExpiry" type="date" /></label><label><span>No. HP</span><input name="phone" inputMode="tel" placeholder="0812..." /></label><label><span>Status</span><select name="status" defaultValue="Aktif"><option>Aktif</option><option>Tersedia</option><option>Bertugas</option><option>Libur</option><option>Tidak Aktif</option></select></label><label><span>URL Foto</span><input name="photoUrl" type="url" placeholder="https://..." /></label><label className="full-field"><span>Alamat</span><textarea name="address" rows={3} placeholder="Jl. ..." /></label></div><footer><button className="button modal-cancel" type="button" onClick={onClose}>Batal</button><button className="button modal-save" type="submit">Simpan</button></footer></form></section></div>;
}

function MaintenancePanel({ records, onAdd }: { records: MaintenanceRecord[]; onAdd: () => void }) {
  return <section className="admin-section"><div className="section-tools"><div><h2>Riwayat pemeliharaan</h2><p>Servis, perbaikan, biaya, dan odometer armada.</p></div><button className="button button-dark" onClick={onAdd}>+ Tambah Pemeliharaan</button></div>{records.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Kendaraan</th><th>Tanggal</th><th>Jenis</th><th>Bengkel</th><th>Kilometer</th><th>Biaya</th><th>Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.vehicle_name}</strong><small>{record.plate_number}</small></td><td>{formatDate(record.service_date)}</td><td>{record.service_type}</td><td>{record.vendor ?? "Belum ditentukan"}</td><td>{record.odometer.toLocaleString("id-ID")} km</td><td>{formatRupiah(record.cost)}</td><td><StatusPill value={record.status} /></td></tr>)}</tbody></table></div> : <div className="empty-admin-state"><strong>Belum ada riwayat pemeliharaan</strong><p>Tambahkan servis atau perbaikan kendaraan melalui tombol di atas.</p></div>}</section>;
}

function MaintenanceModal({ vehicles, onClose, onSubmit }: { vehicles: Vehicle[]; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="driver-modal maintenance-modal" role="dialog" aria-modal="true" aria-labelledby="maintenance-modal-title"><header><h2 id="maintenance-modal-title">Tambah Pemeliharaan</h2><button type="button" onClick={onClose} aria-label="Tutup formulir">×</button></header><form onSubmit={onSubmit}><div className="driver-form-grid"><label><span>Kendaraan *</span><select name="vehicleId" required defaultValue=""><option value="" disabled>-- Pilih Kendaraan --</option>{vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.plate_number} · {vehicle.brand} {vehicle.model}</option>)}</select></label><label><span>Tanggal</span><input name="serviceDate" type="date" required defaultValue={today} /></label><label><span>Jenis</span><select name="serviceType" defaultValue="Servis Rutin"><option>Servis Rutin</option><option>Perbaikan</option><option>Ganti Oli</option><option>Ban</option><option>Kelistrikan</option><option>Body Repair</option><option>Lainnya</option></select></label><label><span>Status</span><select name="status" defaultValue="Diajukan"><option>Diajukan</option><option>Dijadwalkan</option><option>Dikerjakan</option><option>Selesai</option><option>Dibatalkan</option></select></label><label><span>Bengkel</span><input name="vendor" placeholder="Nama bengkel" /></label><label><span>Kilometer</span><input name="odometer" type="number" min="0" step="1" defaultValue="0" /></label><label><span>Biaya (Rp)</span><input name="cost" type="number" min="0" step="1" defaultValue="0" /></label><label className="full-field"><span>Deskripsi</span><textarea name="notes" rows={3} placeholder="Detail perbaikan..." /></label></div><footer><button className="button modal-cancel" type="button" onClick={onClose}>Batal</button><button className="button modal-save" type="submit">Simpan</button></footer></form></section></div>;
}

function FuelPanel({ records, onAdd }: { records: FuelRecord[]; onAdd: () => void }) {
  return <section className="admin-section"><div className="section-tools"><div><h2>Riwayat pengisian BBM</h2><p>Penggunaan bahan bakar, kilometer, dan biaya per kendaraan.</p></div><button className="button button-dark" onClick={onAdd}>+ Tambah Pengisian BBM</button></div>{records.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Kendaraan</th><th>Tanggal</th><th>Jenis BBM</th><th>SPBU</th><th>Liter</th><th>Harga/Liter</th><th>Kilometer</th><th>Total</th><th>Bukti</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.vehicle_name}</strong><small>{record.plate_number}</small></td><td>{formatDate(record.fill_date)}</td><td>{record.fuel_type}</td><td>{record.station ?? "Belum diisi"}</td><td>{record.liters.toLocaleString("id-ID", { maximumFractionDigits: 2 })} L</td><td>{formatRupiah(record.price_per_liter)}</td><td>{record.odometer.toLocaleString("id-ID")} km</td><td><strong>{formatRupiah(record.total_cost)}</strong></td><td>{record.receipt_url ? <a className="receipt-link" href={record.receipt_url} target="_blank" rel="noreferrer">Lihat struk ↗</a> : "—"}</td></tr>)}</tbody></table></div> : <div className="empty-admin-state"><strong>Belum ada riwayat pengisian BBM</strong><p>Tambahkan transaksi bahan bakar melalui tombol di atas.</p></div>}</section>;
}

function FuelModal({ vehicles, onClose, onSubmit }: { vehicles: Vehicle[]; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [liters, setLiters] = useState("0");
  const [pricePerLiter, setPricePerLiter] = useState("0");
  const total = Math.round((Number(liters) || 0) * (Number(pricePerLiter) || 0));
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="driver-modal fuel-modal" role="dialog" aria-modal="true" aria-labelledby="fuel-modal-title"><header><h2 id="fuel-modal-title">Tambah Pengisian BBM</h2><button type="button" onClick={onClose} aria-label="Tutup formulir">×</button></header><form onSubmit={onSubmit}><div className="driver-form-grid"><label><span>Kendaraan *</span><select name="vehicleId" required defaultValue=""><option value="" disabled>-- Pilih Kendaraan --</option>{vehicles.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{vehicle.plate_number} · {vehicle.brand} {vehicle.model}</option>)}</select></label><label><span>Tanggal</span><input name="fillDate" type="date" required defaultValue={today} /></label><label><span>Jenis BBM</span><select name="fuelType" defaultValue="Pertalite"><option>Pertalite</option><option>Pertamax</option><option>Pertamax Turbo</option><option>Dexlite</option><option>Pertamina Dex</option><option>Solar</option><option>Listrik</option><option>Lainnya</option></select></label><label><span>Lokasi SPBU</span><input name="station" placeholder="Pertamina Jl. Sudirman" /></label><label><span>Liter</span><input name="liters" type="number" min="0" step="0.01" value={liters} onChange={(event) => setLiters(event.target.value)} /></label><label><span>Harga / Liter (Rp)</span><input name="pricePerLiter" type="number" min="0" step="1" value={pricePerLiter} onChange={(event) => setPricePerLiter(event.target.value)} /></label><label><span>Kilometer</span><input name="odometer" type="number" min="0" step="1" defaultValue="0" /></label><label><span>URL Bukti Struk</span><input name="receiptUrl" type="url" placeholder="https://..." /></label><div className="fuel-total full-field"><span>Total Biaya:</span><strong>{formatRupiah(total)}</strong></div></div><footer><button className="button modal-cancel" type="button" onClick={onClose}>Batal</button><button className="button modal-save" type="submit">Simpan</button></footer></form></section></div>;
}

function VehicleForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="vehicle-form" onSubmit={onSubmit}><label><span>Nomor polisi</span><input name="plateNumber" required /></label><label><span>Merek</span><input name="brand" required /></label><label><span>Model/tipe</span><input name="model" required /></label><label><span>Kategori</span><select name="category" required>{["Roda Dua", "Kendaraan Jabatan", "Layanan Tamu", "Operasional Biro"].map((v) => <option key={v}>{v}</option>)}</select></label><label><span>Jenis</span><input name="bodyType" placeholder="Sedan, Mini Bus…" /></label><label><span>Tahun</span><input name="year" type="number" min="1900" max="2100" /></label><label><span>Pengguna/unit</span><input name="assignee" /></label><label><span>Jatuh tempo pajak</span><input name="taxDueDate" type="date" /></label><label><span>Status</span><select name="status">{["Tersedia", "Dipakai", "Servis", "Tidak Aktif"].map((v) => <option key={v}>{v}</option>)}</select></label><label className="wide"><span>Keterangan</span><input name="notes" /></label><button className="button button-primary">Simpan kendaraan</button></form>;
}

function StatusPill({ value }: { value: string }) { return <span className={`status-pill status-${slug(value)}`}><i />{value}</span>; }
function slug(value: string) { return value.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, ""); }
function formatDate(value: string | null) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Belum diisi"; }
function formatRupiah(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
