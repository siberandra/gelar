# 01 — Analisis Kebutuhan

Dokumen ini menerjemahkan brief "Event Management Platform" menjadi kebutuhan yang bisa dikerjakan dan dites. Setiap kebutuhan diberi kode (FR = functional requirement, BR = business rule, NFR = non-functional requirement) supaya nanti bisa dilacak sampai ke kode dan unit test.

## 1. Latar belakang

Penyelenggara acara (seminar, konser kecil, workshop) butuh tempat untuk membuat acara, menjual tiket, dan memverifikasi pembayaran. Pembeli butuh tempat untuk mencari acara, membeli tiket, dan memberi ulasan.

Nama aplikasi: **Gelar** (dari "menggelar acara").

## 2. Aktor

| Aktor | Keterangan |
|---|---|
| Guest | Pengunjung belum login. Boleh melihat dan mencari acara, tidak boleh membeli. |
| Customer | Pembeli tiket. Punya poin, kupon, riwayat transaksi, dan bisa memberi ulasan. |
| Organizer | Penyelenggara acara. Membuat acara, voucher, dan mengonfirmasi pembayaran. Di brief disebut juga "admin" pada status *waiting for admin confirmation*. |
| System | Job terjadwal yang mengubah status transaksi secara otomatis (expired / canceled). |

## 3. Kebutuhan fungsional

### Feature 1

**A. Event discovery, detail, pembuatan, promosi**

| Kode | Kebutuhan |
|---|---|
| FR-01 | Landing page menampilkan daftar acara yang akan datang (tanggal mulai > sekarang). |
| FR-02 | Pengguna bisa memfilter acara berdasarkan kategori dan lokasi (kota). |
| FR-03 | Search bar dengan debounce (request baru dikirim 500 ms setelah user berhenti mengetik). |
| FR-04 | Halaman detail acara: info acara, jenis tiket + harga + sisa kursi, organizer, ulasan. |
| FR-05 | Jika hasil filter/pencarian kosong, tampil pesan "tidak ada acara" (bukan halaman kosong). |
| FR-06 | Organizer membuat acara: nama, kategori, deskripsi, lokasi, tanggal mulai & selesai, gambar, dan minimal satu jenis tiket (nama, harga, kuota kursi). |
| FR-07 | Acara bisa gratis (harga tiket 0) atau berbayar. |
| FR-08 | Organizer membuat voucher promo untuk acara miliknya: kode, potongan (Rp), kuota, tanggal mulai & berakhir. |

**B. Transaksi**

| Kode | Kebutuhan |
|---|---|
| FR-09 | Customer membeli tiket (pilih jenis tiket dan jumlah) lalu checkout. |
| FR-10 | Saat checkout customer bisa memakai voucher acara, kupon referral, dan poin. |
| FR-11 | Setelah checkout tampil hitung mundur 2 jam untuk upload bukti bayar. |
| FR-12 | Customer upload bukti bayar → status jadi *waiting for admin confirmation*. |
| FR-13 | Customer bisa membatalkan transaksi selama status masih *waiting for payment*. |
| FR-14 | Transaksi punya 6 status (lihat BR-10). |

**C. Ulasan**

| Kode | Kebutuhan |
|---|---|
| FR-15 | Customer memberi rating (1–5) dan ulasan setelah menghadiri acara. |
| FR-16 | Halaman profil organizer menampilkan rata-rata rating dan daftar ulasan dari semua acaranya. |

### Feature 2

**D. Autentikasi & otorisasi**

| Kode | Kebutuhan |
|---|---|
| FR-17 | Registrasi dengan pilihan peran: customer atau organizer. |
| FR-18 | Customer boleh mengisi kode referral saat registrasi (opsional). |
| FR-19 | Setiap user baru otomatis dapat kode referral unik yang tidak bisa diubah. |
| FR-20 | Login, logout, dan proteksi halaman sesuai peran (protected route). |

**E. Referral, profil, hadiah**

| Kode | Kebutuhan |
|---|---|
| FR-21 | Registrasi dengan referral → user baru dapat kupon diskon, pemilik kode dapat 10.000 poin. |
| FR-22 | Edit profil: nama, foto profil. |
| FR-23 | Ganti password (harus memasukkan password lama). |
| FR-24 | Lupa password: link reset dikirim lewat email. |
| FR-25 | Customer bisa melihat saldo poin, tanggal kedaluwarsa, dan kupon miliknya. |

**F. Dashboard organizer**

| Kode | Kebutuhan |
|---|---|
| FR-26 | Organizer melihat, mengedit, dan mengelola acaranya. |
| FR-27 | Statistik (jumlah tiket terjual & pendapatan) dalam grafik per tahun, bulan, dan hari. |
| FR-28 | Organizer melihat bukti bayar lalu menerima atau menolak transaksi. |
| FR-29 | Customer menerima email saat transaksinya diterima atau ditolak. |
| FR-30 | Daftar peserta per acara: nama, jumlah tiket, total yang dibayar. |

## 4. Aturan bisnis

Bagian ini paling penting karena di sinilah logika yang sering salah.

### Harga dan diskon

- **BR-01** Semua harga dalam Rupiah, disimpan sebagai bilangan bulat (tanpa sen).
- **BR-02** Urutan perhitungan harga:
  ```
  subtotal       = Σ (harga tiket × jumlah)
  setelah voucher = subtotal − potongan voucher
  setelah kupon   = setelah voucher − potongan kupon
  total bayar     = setelah kupon − poin yang dipakai
  ```
  Total tidak pernah di bawah 0. Poin yang dipakai maksimal sebesar sisa harga.
- **BR-03** Satu transaksi maksimal 1 voucher dan 1 kupon. Poin boleh dipakai berapa saja selama saldonya cukup.
- **BR-04** **Voucher** dibuat organizer, hanya berlaku untuk acara tertentu miliknya, dalam rentang tanggal tertentu, dan selama kuota masih ada.
- **BR-05** **Kupon** diberikan sistem (dari referral), berlaku untuk semua acara. Nilainya 10% dari harga, maksimal Rp 50.000. Berlaku 3 bulan dan hanya sekali pakai.
- **BR-06** Acara gratis (total 0) langsung berstatus *done* tanpa upload bukti bayar.

### Poin

- **BR-07** Pemilik kode referral dapat 10.000 poin setiap ada user baru yang memakai kodenya.
- **BR-08** Setiap tambahan poin kedaluwarsa 3 bulan setelah diberikan. Contoh dari brief: tanggal 28 Des 2023 ada 3 orang memakai kode → saldo 30.000, berlaku sampai 28 Mar 2024.
- **BR-09** Saat dipakai, poin yang paling cepat kedaluwarsa dipotong lebih dulu (FIFO). Sistem mencatat poin mana yang dipakai supaya bisa dikembalikan dengan tepat.

### Status transaksi

- **BR-10** Ada 6 status:

  | Status | Arti |
  |---|---|
  | `WAITING_PAYMENT` | Sudah checkout, belum upload bukti bayar |
  | `WAITING_CONFIRMATION` | Bukti bayar sudah diupload, menunggu organizer |
  | `DONE` | Diterima organizer (atau acara gratis) |
  | `REJECTED` | Ditolak organizer |
  | `EXPIRED` | Tidak upload bukti dalam 2 jam |
  | `CANCELED` | Dibatalkan customer, atau organizer tidak merespons dalam 3 hari |

- **BR-11** `WAITING_PAYMENT` lebih dari 2 jam → otomatis `EXPIRED`.
- **BR-12** `WAITING_CONFIRMATION` lebih dari 3 hari → otomatis `CANCELED`.
- **BR-13** Kursi langsung dikurangi saat checkout (bukan saat dibayar), supaya tidak ada dua orang membeli kursi terakhir yang sama.
- **BR-14** **Rollback**: jika transaksi menjadi `EXPIRED`, `CANCELED`, atau `REJECTED`, maka:
  1. kursi dikembalikan,
  2. kuota voucher dikembalikan,
  3. kupon bisa dipakai lagi,
  4. poin dikembalikan ke baris poin asalnya (tanggal kedaluwarsanya tetap yang lama).

  Keempatnya dijalankan dalam **satu SQL transaction**, jadi kalau satu langkah gagal semuanya dibatalkan.

### Ulasan

- **BR-15** Customer dianggap "sudah menghadiri" jika punya transaksi `DONE` untuk acara itu **dan** tanggal selesai acara sudah lewat.
- **BR-16** Satu customer hanya boleh memberi satu ulasan per acara.

### Akun

- **BR-17** Kode referral: 8 karakter huruf besar + angka, unik, dibuat sekali saat registrasi, tidak ada endpoint untuk mengubahnya.
- **BR-18** Kode referral yang diisi saat registrasi harus milik customer yang sudah ada. Kode tidak valid → registrasi ditolak dengan pesan jelas.
- **BR-19** Link reset password berlaku 1 jam dan hanya bisa dipakai sekali.

## 5. Kebutuhan non-fungsional

| Kode | Kebutuhan |
|---|---|
| NFR-01 | Responsif: nyaman dipakai dari lebar 360 px (HP) sampai desktop. |
| NFR-02 | Setiap aksi yang mengubah data (hapus, terima, tolak, batal) memakai dialog konfirmasi. |
| NFR-03 | Aksi yang mengubah lebih dari satu tabel memakai SQL transaction. |
| NFR-04 | Password disimpan dalam bentuk hash (bcrypt), tidak pernah plaintext. |
| NFR-05 | Setiap alur utama punya unit test. |
| NFR-06 | Data contoh (seed) relevan: acara, kategori, dan kota di Indonesia. |
| NFR-07 | Upload gambar maksimal 2 MB, format JPG/PNG/WEBP. |

## 6. Asumsi yang saya ambil

Brief tidak menjelaskan beberapa hal, jadi saya putuskan sendiri dan mencatatnya di sini:

1. Besar kupon referral tidak disebut → 10%, maksimal Rp 50.000.
2. Voucher memakai potongan nominal (Rp), bukan persen, supaya organizer mudah menghitung.
3. "Admin" pada status *waiting for admin confirmation* = organizer pemilik acara. Tidak ada peran admin terpisah, karena brief hanya menyebut dua peran.
4. Satu transaksi hanya untuk satu acara, tapi boleh berisi beberapa jenis tiket.
5. Lokasi difilter berdasarkan kota.
6. Poin hanya untuk customer. Organizer tetap punya kode referral (aturan "semua user baru"), tapi kodenya tidak bisa dipakai (BR-18).

## 7. Di luar cakupan (out of scope)

- Payment gateway otomatis (pembayaran manual lewat transfer + bukti bayar, sesuai brief).
- Tiket QR / check-in di lokasi.
- Refund untuk transaksi yang sudah `DONE`.
