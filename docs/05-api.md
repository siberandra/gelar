# 05 — Rancangan API

Base URL: `/api`. Format request & response: JSON (kecuali upload file: `multipart/form-data`).

Keterangan akses: **P** = publik, **L** = harus login, **C** = customer, **O** = organizer.

## Auth

| Method | Endpoint | Akses | Keterangan |
|---|---|:-:|---|
| POST | /auth/register | P | name, email, password, role, referralCode? |
| POST | /auth/login | P | email, password → token |
| GET | /auth/me | L | data user yang sedang login |
| POST | /auth/forgot-password | P | email |
| POST | /auth/reset-password | P | token, password |

## Profil

| Method | Endpoint | Akses | Keterangan |
|---|---|:-:|---|
| PATCH | /profile | L | name, bio, avatar (file) |
| PATCH | /profile/password | L | oldPassword, newPassword |
| GET | /profile/rewards | C | saldo poin, rincian kedaluwarsa, kupon |
| GET | /organizers/:id | P | profil organizer + rating + ulasan |

## Acara

| Method | Endpoint | Akses | Keterangan |
|---|---|:-:|---|
| GET | /events | P | `?search=&category=&city=&page=` hanya acara mendatang |
| GET | /events/:slug | P | detail + jenis tiket + ulasan |
| GET | /categories | P | |
| GET | /cities | P | daftar kota yang punya acara |
| POST | /events | O | buat acara + jenis tiket |
| PUT | /events/:id | O | edit (hanya pemilik) |
| DELETE | /events/:id | O | hanya jika belum ada transaksi |

## Voucher

| Method | Endpoint | Akses | Keterangan |
|---|---|:-:|---|
| GET | /events/:id/vouchers | O | |
| POST | /events/:id/vouchers | O | |
| DELETE | /vouchers/:id | O | |
| GET | /vouchers/check | C | `?eventId=&code=` cek sebelum checkout |

## Transaksi (customer)

| Method | Endpoint | Akses | Keterangan |
|---|---|:-:|---|
| POST | /transactions | C | eventId, items[], voucherCode?, couponId?, points? |
| GET | /transactions | C | riwayat milik sendiri |
| GET | /transactions/:id | C | detail + sisa waktu |
| POST | /transactions/:id/proof | C | upload bukti bayar |
| POST | /transactions/:id/cancel | C | hanya saat WAITING_PAYMENT |

## Ulasan

| Method | Endpoint | Akses | Keterangan |
|---|---|:-:|---|
| POST | /events/:id/reviews | C | rating, comment (BR-15, BR-16) |

## Dashboard organizer

| Method | Endpoint | Akses | Keterangan |
|---|---|:-:|---|
| GET | /dashboard/summary | O | total acara, tiket terjual, pendapatan |
| GET | /dashboard/stats | O | `?period=year|month|day&eventId=` data grafik |
| GET | /dashboard/events | O | acara milik sendiri |
| GET | /dashboard/transactions | O | `?status=&eventId=` |
| POST | /dashboard/transactions/:id/accept | O | → DONE + email |
| POST | /dashboard/transactions/:id/reject | O | → REJECTED + rollback + email |
| GET | /dashboard/events/:id/attendees | O | nama, jumlah tiket, total dibayar |

## File

| Method | Endpoint | Akses | Keterangan |
|---|---|:-:|---|
| GET | /files/:id | P\* | gambar acara & avatar publik; bukti bayar hanya untuk pemilik transaksi dan organizer acaranya |

## Format error

Semua error memakai bentuk yang sama supaya frontend mudah menampilkannya:

```json
{ "message": "Kursi untuk tiket VIP tidak cukup" }
```

| Kode | Kapan |
|---|---|
| 400 | Input tidak valid / aturan bisnis dilanggar |
| 401 | Belum login / token salah |
| 403 | Login, tapi tidak berhak (peran salah atau bukan pemilik) |
| 404 | Data tidak ditemukan |
| 409 | Konflik (email sudah dipakai, sudah pernah review) |
