"use client";

import { FormEvent, useState } from "react";

export function PublicRequestForm() {
  const [state, setState] = useState<{ loading: boolean; message: string; success: boolean }>({ loading: false, message: "", success: false });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, message: "", success: false });
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { id?: string; error?: string };
    if (!response.ok) {
      setState({ loading: false, message: result.error ?? "Permohonan belum dapat dikirim.", success: false });
      return;
    }
    form.reset();
    setState({ loading: false, message: `Permohonan berhasil dicatat dengan nomor ${result.id}.`, success: true });
  }

  return (
    <form className="request-form" onSubmit={submit}>
      <div className="form-grid">
        <label><span>Nama pemohon</span><input name="applicantName" required placeholder="Nama lengkap" /></label>
        <label><span>Unit kerja</span><input name="unit" required placeholder="Contoh: Biro Umum" /></label>
        <label><span>Nomor WhatsApp</span><input name="contactPhone" inputMode="tel" placeholder="08xxxxxxxxxx" /></label>
        <label><span>Tanggal penggunaan</span><input name="eventDate" type="date" required /></label>
        <label><span>Waktu</span><input name="eventTime" type="time" required /></label>
        <label><span>Tujuan</span><input name="destination" required placeholder="Lokasi tujuan" /></label>
        <label className="full-field"><span>Keperluan</span><textarea name="purpose" required rows={4} placeholder="Jelaskan kebutuhan perjalanan dinas" /></label>
      </div>
      {state.message && <p className={state.success ? "form-message success" : "form-message error"} role="status">{state.message}</p>}
      <button className="button button-primary submit-button" disabled={state.loading}>{state.loading ? "Mengirim…" : "Kirim permohonan"}<span>→</span></button>
    </form>
  );
}
