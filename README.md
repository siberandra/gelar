# Gelar

Platform manajemen acara: organizer membuat dan mempromosikan acara, customer mencari, membeli tiket, dan memberi ulasan.

## Dokumentasi

0. [Brief tugas](docs/00-brief.md) — salinan requirement asli
1. [Analisis kebutuhan](docs/01-analisis-kebutuhan.md) — aktor, kebutuhan fungsional, aturan bisnis
2. [Arsitektur](docs/02-arsitektur.md) — teknologi, struktur folder, keputusan teknis
3. [Database](docs/03-database.md) — ERD dan alasan desain
4. [Alur proses](docs/04-alur-proses.md) — status transaksi, checkout, rollback, referral
5. [API](docs/05-api.md) — daftar endpoint
6. [PRD](docs/07-prd.md) — 6 epik, 28 user story, 76 acceptance criteria

## Akun demo

Semua akun memakai password `password123` (data dari `npm run db:seed`).

| Peran | Email | Isi data |
|---|---|---|
| Customer | budi@gelar.id | 30.000 poin, tiket menunggu pembayaran, acara lampau yang bisa diulas |
| Customer | siti@gelar.id | Kupon referral aktif, tiket menunggu pembayaran |
| Organizer | soundwave@gelar.id | 9 acara, grafik penjualan, transaksi menunggu konfirmasi |
| Organizer | laribareng@gelar.id, ruangbelajar@gelar.id, rasanusantara@gelar.id, kodekita@gelar.id | Acara per kategori |

Foto acara dan profil berlisensi CC0, lihat [api/prisma/seed-images/CREDITS.md](api/prisma/seed-images/CREDITS.md).

## Teknologi

React, Vite, TailwindCSS, Axios · Node.js, Express.js, Prisma, PostgreSQL · Jest · Docker

## Tahapan

- [x] Analisis & arsitektur
- [ ] Desain UI
- [ ] Development
- [ ] Testing
- [ ] Deploy
