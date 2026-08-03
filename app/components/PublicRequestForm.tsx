"use client";

import { FormEvent, useState } from "react";
import type { Driver, Vehicle } from "../../db/queries";

export function PublicRequestForm({ vehicles, drivers }: { vehicles: Vehicle[]; drivers: Driver[] }) {
  const [state, setState] = useState({ loading: false, message: "", success: false });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, message: "", success: false });
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    const details = [payload.requestedVehicle && `Kendaraan: ${payload.requestedVehicle}`, payload.preferredDriver && `Pengemudi: ${payload.preferredDriver}`, payload.notes && `Catatan: ${payload.notes}`].filter(Boolean).join(" | ");
    payload.purpose = details ? `${payload.purpose} | ${details}` : payload.purpose;
    const response = await fetch("/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { id?: string; error?: string };
    if (!response.ok) {
      setState({ loading: false, message: result.error ?? "Pengajuan belum dapat dikirim.", success: false });
      return;
    }
    form.reset();
    setState({ loading: false, message: `Pengajuan berhasil dicatat dengan nomor ${result.id}.`, success: true });
  }

  return (
    <form className="request-form" onSubmit={submit}>
      <div className="form-grid">
        <label><span>Nama Peminjam *</span><input name="applicantName" required placeholder="Nama lengkap" /></label>
        <label><span>No. HP</span><input name="contactPhone" inputMode="tel" placeholder="08xx" /></label>
        <label><span>Kendaraan *</span><select name="requestedVehicle" required defaultValue=""><option value="" disabled>-- Pilih Kendaraan --</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={`${vehicle.plate_number} - ${vehicle.brand} ${vehicle.model}`}>{vehicle.brand} {vehicle.model} · {vehicle.plate_number}</option>)}</select></label>
        <label><span>Pengemudi (opsional)</span><select name="preferredDriver" defaultValue=""><option value="">-- Pilih Pengemudi --</option>{drivers.map((driver) => <option key={driver.id} value={driver.name}>{driver.name}</option>)}</select></label>
        <label><span>Tanggal Pinjam *</span><input name="eventDate" type="date" required /></label>
        <label><span>Waktu Penggunaan *</span><input name="eventTime" type="time" required /></label>
        <label><span>Unit Kerja *</span><input name="unit" required placeholder="Contoh: Biro Umum" /></label>
        <label><span>Tujuan *</span><input name="destination" required placeholder="Lokasi tujuan" /></label>
        <label className="full-field"><span>Keperluan *</span><input name="purpose" required placeholder="Dinas ke..." /></label>
        <label className="full-field"><span>Catatan</span><textarea name="notes" rows={3} placeholder="Catatan tambahan..." /></label>
      </div>
      {state.message && <p className={state.success ? "form-message success" : "form-message error"} role="status">{state.message}</p>}
      <button className="button button-primary submit-button" disabled={state.loading}>{state.loading ? "Mengirim…" : "Kirim Pengajuan"}<span>→</span></button>
    </form>
  );
}
