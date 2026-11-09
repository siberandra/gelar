# 04 — Alur Proses

## 1. Siklus hidup transaksi

```mermaid
stateDiagram-v2
    [*] --> WAITING_PAYMENT: checkout (berbayar)
    [*] --> DONE: checkout (gratis)
    WAITING_PAYMENT --> WAITING_CONFIRMATION: customer upload bukti
    WAITING_PAYMENT --> EXPIRED: lewat 2 jam (sistem)
    WAITING_PAYMENT --> CANCELED: dibatalkan customer
    WAITING_CONFIRMATION --> DONE: diterima organizer
    WAITING_CONFIRMATION --> REJECTED: ditolak organizer
    WAITING_CONFIRMATION --> CANCELED: lewat 3 hari (sistem)
    DONE --> [*]
    REJECTED --> [*]: rollback + email
    EXPIRED --> [*]: rollback
    CANCELED --> [*]: rollback
```

Perubahan status hanya boleh mengikuti panah di atas. Contoh: transaksi `EXPIRED` tidak bisa diterima organizer. Aturan ini dicek di service, jadi request yang tidak sah ditolak.

## 2. Checkout

```mermaid
sequenceDiagram
    actor C as Customer
    participant W as Web
    participant A as API
    participant D as Database

    C->>W: pilih tiket, voucher, kupon, poin
    W->>A: POST /transactions
    A->>A: validasi input
    A->>D: BEGIN
    A->>D: kurangi kursi (bersyarat available >= qty)
    A->>D: cek & tambah pemakaian voucher
    A->>D: cek & tandai kupon terpakai
    A->>D: potong poin FIFO + catat point_usages
    A->>D: simpan transaksi + item
    A->>D: COMMIT
    Note over A,D: jika salah satu gagal → ROLLBACK, tidak ada data yang berubah
    A-->>W: transaksi + payment_deadline
    W-->>C: halaman bayar + hitung mundur 2 jam
```

Harga dihitung ulang di server dari data database. Harga yang dikirim browser diabaikan.

## 3. Rollback (expired / canceled / rejected)

Satu fungsi `releaseTransaction(tx)` dipakai di keempat kasus (expired oleh sistem, cancel oleh customer, auto-cancel oleh sistem, reject oleh organizer), jadi logikanya hanya ditulis sekali dan dites sekali:

```
BEGIN
  ubah status (hanya jika status lama masih sesuai)
  available ticket_types += quantity     (per item)
  vouchers.used -= 1                      (jika pakai voucher)
  coupons.used_at = NULL                  (jika pakai kupon)
  points.remaining += amount              (per point_usages)
COMMIT
```

"Hanya jika status lama masih sesuai" mencegah rollback dobel. Misalnya scheduler dan organizer memproses transaksi yang sama di waktu bersamaan: hanya satu yang berhasil mengubah status, yang lain tidak melakukan apa-apa.

## 4. Registrasi dengan referral

```mermaid
sequenceDiagram
    actor N as User baru
    participant A as API
    participant D as Database

    N->>A: POST /auth/register (+ kode referral)
    A->>D: cari pemilik kode
    alt kode tidak valid
        A-->>N: 400 "Kode referral tidak ditemukan"
    else valid / kosong
        A->>D: BEGIN
        A->>D: buat user + kode referral baru
        opt pakai kode referral
            A->>D: buat kupon untuk user baru (berlaku 3 bulan)
            A->>D: tambah 10.000 poin untuk pemilik kode (berlaku 3 bulan)
        end
        A->>D: COMMIT
        A-->>N: 201 + token
    end
```

## 5. Lupa password

1. User mengisi email di halaman "Lupa password".
2. API membuat token acak, menyimpan **hash**-nya (bukan token asli) dengan masa berlaku 1 jam, lalu mengirim link `/reset-password?token=...` ke email.
3. API selalu menjawab "Jika email terdaftar, link sudah dikirim", supaya orang lain tidak bisa mengecek email mana yang terdaftar.
4. User membuka link, mengisi password baru, lalu token ditandai terpakai.

## 6. Halaman per peran

| Halaman | Guest | Customer | Organizer |
|---|:-:|:-:|:-:|
| Beranda, jelajah, detail acara, profil organizer | ✓ | ✓ | ✓ |
| Login, register, lupa password | ✓ | | |
| Checkout, pembayaran, tiket saya, poin & kupon | | ✓ | |
| Tulis ulasan | | ✓ | |
| Profil & ganti password | | ✓ | ✓ |
| Dashboard, kelola acara, voucher, transaksi, peserta, statistik | | | ✓ |
