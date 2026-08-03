# SIMKEDIS

Sistem Informasi Kendaraan Dinas dengan beranda layanan publik, formulir permohonan, dan dashboard admin terautentikasi.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Neon Postgres untuk data armada dan permohonan
- Clerk untuk login admin
- Vercel untuk deployment

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env.local`.
2. Isi `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, dan `CLERK_SECRET_KEY`.
3. Isi `ADMIN_EMAILS` untuk membatasi akun yang boleh masuk ke dashboard.
4. Jalankan `npm ci` lalu `npm run dev`.

Schema dan data contoh dibuat idempoten pada akses database pertama. Ganti data contoh dengan data armada yang sudah diverifikasi sebelum dipakai sebagai sumber resmi.

## Deployment Vercel

Hubungkan repository ke Vercel, lalu pasang integrasi Marketplace Neon dan Clerk. Keduanya memprovisikan environment variable yang dibutuhkan. Tambahkan `ADMIN_EMAILS` secara manual pada Production, Preview, dan Development.

Jangan commit `.env` atau credential apa pun. Repository lama pernah melacak `.env`; file tersebut dihapus pada migrasi ini dan kunci lama sebaiknya dirotasi.

## Pemeriksaan

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
