# Gelar: Product & Technical Requirements

## 0. Kendali dokumen

| Kode produk | Versi | Tanggal | Status | Product Manager | Associate PM |
|---|---|---|---|---|---|
| GELAR | 1.1 | 09 Nov 2026 | Draf | Vicky | - |

### Riwayat revisi

| Versi | Tanggal | Perubahan | Oleh |
|---|---|---|---|
| 1.0 | 09 Nov 2026 | Draf awal dari brief dan dokumen 01-05 | Vicky |
| 1.1 | 09 Nov 2026 | Bab 7 dilengkapi 28 user story; ruang lingkup teknis disesuaikan dengan proyek perorangan | Vicky |

### Persetujuan

| Peran | Nama | Tanggal | Status |
|---|---|---|---|
| Product Owner | Mentor bootcamp | | Menunggu |
| Developer | Vicky | 09 Nov 2026 | Disetujui |

## 1. Ringkasan eksekutif

Penyelenggara acara kecil (komunitas, workshop, konser lokal) butuh satu tempat untuk membuat acara, menjual tiket, dan memverifikasi pembayaran manual. Pembeli butuh tempat untuk mencari acara, membeli tiket, dan memberi ulasan.

**Gelar** adalah aplikasi web untuk kebutuhan itu: discovery acara dengan filter dan pencarian, transaksi dengan bukti transfer dan status otomatis, voucher dari organizer, serta kupon dan poin dari program referral. MVP ini dikerjakan satu orang sebagai mini project bootcamp. Ukuran keberhasilannya adalah semua poin brief terpenuhi dan teruji.

## 2. Hasil riset & bukti

Tidak ada riset pengguna formal. Kebutuhan diambil dari brief tugas (`docs/00-brief.md`) dan dibandingkan dengan platform rujukan di brief: Eventbrite, Loket, dan Ticket Tailor. Pola yang diambil dari rujukan:

- kartu acara dengan harga mulai,
- filter kategori dan kota,
- pembayaran dengan batas waktu,
- profil penyelenggara dengan rating.

## 3. Pengguna & persona

**Guest**: belum login. Menjelajah, mencari, dan melihat detail acara. Diarahkan ke login saat ingin membeli.

**Customer** (contoh: Budi, mahasiswa, memakai HP): membeli tiket, memakai voucher/kupon/poin, mengupload bukti transfer, dan memberi ulasan. Kesulitannya: lupa mengupload bukti tepat waktu, dan tidak tahu kapan poinnya hangus.

**Organizer** (contoh: komunitas Soundwave, memakai laptop): membuat acara dan voucher, mengecek bukti transfer, dan melihat penjualan. Kesulitannya: takut tiket terjual melebihi kapasitas, dan rekap peserta yang manual.

## 4. Tujuan & ukuran keberhasilan

| Tujuan | Metrik (KPI) | Nilai sekarang | Target | Cara mengukur |
|---|---|---|---|---|
| Semua fitur brief terpenuhi | Poin brief yang punya user story dan sudah diimplementasi | 0 dari 20 poin | 20 dari 20 poin | Matriks bab 7 dan bab 14 |
| Logika bisnis aman | Unit test lulus | 0 | Semua lulus, minimal satu test per alur | `npm test` di folder api |
| Tidak ada oversell | Transaksi melebihi kursi | - | 0 | Test "dua pembeli berebut kursi terakhir" |
| Responsif | Halaman utama nyaman di 360 px dan 1440 px | - | Semua halaman | Screenshot desktop dan HP |
| Aplikasi bisa diakses publik | URL live | - | 1 URL frontend + 1 URL API | Uji buka dari jaringan lain |

## 5. Ruang lingkup

### 5.1 Termasuk

- Landing page, jelajah acara, filter kategori/kota, pencarian dengan debounce, detail acara.
- Pembuatan, edit, dan hapus acara beserta jenis tiket. Acara gratis dan berbayar.
- Voucher promo per acara dengan periode dan kuota.
- Checkout dengan voucher, kupon, dan poin; batas upload 2 jam; 6 status transaksi; expired dan cancel otomatis; rollback.
- Ulasan setelah acara selesai; rating di profil organizer.
- Registrasi dengan peran dan referral, login JWT, protected route, lupa password.
- Kupon dan poin referral dengan masa berlaku 3 bulan; edit profil dan ganti password.
- Dashboard organizer: ringkasan, grafik tahun/bulan/hari, konfirmasi transaksi, email, daftar peserta.

### 5.2 Tidak termasuk

- Payment gateway otomatis (pembayaran memakai transfer manual dan bukti bayar, sesuai brief).
- Tiket QR dan check-in di lokasi.
- Refund untuk transaksi yang sudah `DONE`.
- Peran admin platform terpisah.
- Multi bahasa (aplikasi hanya Bahasa Indonesia).

### 5.3 Asumsi & batasan

- Kupon referral bernilai 10% dengan potongan maksimal Rp 50.000.
- Voucher berupa potongan nominal Rupiah.
- "Admin" pada status *waiting for admin confirmation* adalah organizer pemilik acara.
- Satu transaksi untuk satu acara, boleh berisi beberapa jenis tiket, maksimal 10 tiket.
- Lokasi difilter berdasarkan kota.
- Poin hanya untuk customer. Organizer tetap punya kode referral, tetapi kodenya tidak bisa dipakai.
- Semua waktu memakai WIB (Asia/Jakarta).
- Dikerjakan satu orang. Hosting memakai layanan dengan paket gratis, sehingga server bisa "tidur" saat tidak dipakai.

## 6. Peran & hak akses

| Kemampuan | Guest | Customer | Organizer |
|---|---|---|---|
| Melihat, mencari, dan memfilter acara | Ya | Ya | Ya |
| Melihat profil organizer | Ya | Ya | Ya |
| Membeli tiket, upload bukti, membatalkan | Tidak | Ya | Tidak |
| Melihat poin, kupon, dan kode referral | Tidak | Ya | Tidak |
| Menulis ulasan (peserta, setelah acara selesai) | Tidak | Ya | Tidak |
| Edit profil dan ganti password | Tidak | Ya | Ya |
| Membuat, mengedit, dan menghapus acara miliknya | Tidak | Tidak | Ya |
| Membuat voucher untuk acaranya | Tidak | Tidak | Ya |
| Menerima/menolak transaksi acaranya | Tidak | Tidak | Ya |
| Dashboard, statistik, daftar peserta | Tidak | Tidak | Ya |

## 7. Kebutuhan fungsional

### EP01 – Discovery & Pengelolaan Acara

| Epic | Prioritas | Peran | Estimasi |
|---|---|---|---|
| EP01 | Must | Guest, Customer, Organizer | 4 hari |

#### EP01.US01 – Landing page acara mendatang

**Sebagai** pengunjung, **saya ingin** melihat acara yang akan datang di halaman utama, **agar** langsung tahu ada acara apa saja.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Ada acara dengan tanggal mulai setelah hari ini | Halaman utama dibuka | Acara tampil sebagai kartu (gambar, kategori, judul, tanggal, kota, harga mulai), diurutkan dari yang paling dekat |
| 2 | Ada acara yang sudah lewat | Halaman utama dibuka | Acara yang sudah lewat tidak tampil |

#### EP01.US02 – Jelajah dan filter kategori/kota

**Sebagai** pengunjung, **saya ingin** memfilter acara berdasarkan kategori dan kota, **agar** hanya melihat acara yang relevan.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Pengunjung di halaman Jelajah | Memilih kategori "Musik" dan kota "Bandung" | Hanya acara musik di Bandung yang tampil |
| 2 | Filter aktif | Klik "Reset filter" | Semua acara mendatang tampil lagi |
| 3 | Tidak ada acara yang cocok | Filter diterapkan | Tampil pesan "Tidak ada acara yang cocok" beserta tombol reset |

#### EP01.US03 – Pencarian dengan debounce

**Sebagai** pengunjung, **saya ingin** mencari acara berdasarkan nama, **agar** cepat menemukan acara tertentu.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Pengunjung mengetik "jazz" | Berhenti mengetik 500 ms | Satu request pencarian dikirim dan hasilnya tampil |
| 2 | Pengunjung masih terus mengetik | Jeda antar ketikan kurang dari 500 ms | Belum ada request yang dikirim |
| 3 | Kata kunci tidak cocok dengan acara mana pun | Hasil dimuat | Tampil pesan bahwa acara tidak ditemukan |

#### EP01.US04 – Detail acara

**Sebagai** pengunjung, **saya ingin** melihat detail acara, **agar** bisa memutuskan membeli tiket.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Pengunjung membuka detail acara | Halaman dimuat | Tampil deskripsi, waktu, tempat, organizer beserta rating, jenis tiket dengan harga dan sisa kursi, voucher yang berlaku, dan ulasan |
| 2 | Kursi suatu jenis tiket habis | Halaman dimuat | Tiket itu bertanda "Habis" dan tidak bisa dipilih |
| 3 | Guest memilih tiket | Klik "Beli Tiket" | Diarahkan ke halaman login, lalu kembali ke acara setelah login |

#### EP01.US05 – Organizer membuat acara

**Sebagai** organizer, **saya ingin** membuat acara dengan beberapa jenis tiket, **agar** acara saya bisa dijual.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Organizer mengisi nama, kategori, deskripsi, kota, tempat, waktu, dan minimal satu jenis tiket | Klik "Simpan Acara" | Acara langsung tayang di halaman jelajah |
| 2 | Harga tiket diisi 0 | Acara disimpan | Tiket tampil sebagai "Gratis" |
| 3 | Tanggal selesai sebelum tanggal mulai | Klik "Simpan Acara" | Muncul pesan "Tanggal selesai harus setelah tanggal mulai" |
| 4 | Gambar lebih dari 2 MB atau bukan JPG/PNG/WEBP | Upload gambar | Muncul pesan error dan acara tidak tersimpan |

#### EP01.US06 – Organizer mengedit dan menghapus acara

**Sebagai** organizer, **saya ingin** mengubah atau menghapus acara saya, **agar** informasinya selalu benar.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Organizer mengubah data acara | Klik "Simpan" | Perubahan tersimpan |
| 2 | Kuota tiket diubah lebih kecil dari jumlah yang terjual | Klik "Simpan" | Muncul pesan kuota minimal sebesar tiket yang sudah terjual |
| 3 | Acara belum punya transaksi | Klik "Hapus" lalu konfirmasi di dialog | Acara terhapus |
| 4 | Acara sudah punya transaksi | Klik "Hapus" lalu konfirmasi | Muncul pesan "Acara yang sudah punya transaksi tidak bisa dihapus" |
| 5 | Organizer lain mencoba mengubah acara ini | Request dikirim | Ditolak dengan kode 403 |

#### EP01.US07 – Organizer membuat voucher promo

**Sebagai** organizer, **saya ingin** membuat voucher untuk acara saya dalam periode tertentu, **agar** penjualan meningkat.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Organizer mengisi kode, potongan (Rp), kuota, tanggal mulai, dan tanggal berakhir | Klik "Simpan" | Voucher tersimpan dan tampil sebagai promo di halaman acara selama periode berlaku |
| 2 | Kode yang sama sudah ada di acara ini | Klik "Simpan" | Muncul pesan "Kode voucher sudah dipakai di acara ini" |
| 3 | Voucher dipakai untuk acara lain | Customer memasukkan kode | Ditolak, karena voucher hanya berlaku untuk acaranya |

### EP02 – Transaksi & Status Otomatis

| Epic | Prioritas | Peran | Estimasi |
|---|---|---|---|
| EP02 | Must | Customer, Sistem | 4 hari |

#### EP02.US01 – Checkout dengan voucher, kupon, dan poin

**Sebagai** customer, **saya ingin** memakai voucher, kupon, dan poin saat checkout, **agar** harga yang saya bayar lebih murah.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Tiket Rp 300.000, saldo poin 20.000 | Toggle "Pakai poin" aktif lalu checkout | Total Rp 280.000 |
| 2 | Customer memakai voucher, kupon, dan poin sekaligus | Checkout | Harga dihitung di server dengan urutan: subtotal, potongan voucher, potongan kupon, lalu poin. Total tidak pernah negatif |
| 3 | Kursi tidak cukup | Checkout | Muncul pesan kursi tidak cukup, dan voucher, kupon, serta poin tidak terpakai |
| 4 | Dua customer membeli kursi terakhir bersamaan | Checkout | Hanya satu transaksi yang berhasil |
| 5 | Total pembayaran 0 (acara gratis) | Checkout | Transaksi langsung berstatus `DONE` tanpa upload bukti |

#### EP02.US02 – Hitung mundur 2 jam dan upload bukti bayar

**Sebagai** customer, **saya ingin** melihat sisa waktu pembayaran dan mengupload bukti transfer, **agar** transaksi saya diproses.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Transaksi baru dibuat | Halaman pembayaran dibuka | Hitung mundur dari 2 jam tampil dan berkurang setiap detik |
| 2 | Status `WAITING_PAYMENT` dan masih dalam 2 jam | Upload gambar bukti | Status menjadi `WAITING_CONFIRMATION` |
| 3 | File bukan gambar atau lebih dari 2 MB | Upload | Muncul pesan error |

#### EP02.US03 – Customer membatalkan transaksi

**Sebagai** customer, **saya ingin** membatalkan transaksi yang belum dibayar, **agar** kursi dan poin saya kembali.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Status `WAITING_PAYMENT` | Klik "Batalkan transaksi" lalu konfirmasi | Status menjadi `CANCELED`, kemudian kursi, voucher, kupon, dan poin dikembalikan |
| 2 | Status sudah `WAITING_CONFIRMATION` | Mencoba membatalkan | Ditolak |

#### EP02.US04 – Otomatis expired setelah 2 jam

**Sebagai** sistem, **saya ingin** menandai transaksi yang tidak dibayar dalam 2 jam, **agar** kursi bisa dibeli orang lain.

| No | Given | When | Then |
|---|---|---|---|
| 1 | `WAITING_PAYMENT` lebih dari 2 jam | Job berjalan (tiap menit) atau transaksi dibuka | Status menjadi `EXPIRED` dan rollback dijalankan |
| 2 | `WAITING_PAYMENT` baru 1,5 jam | Job berjalan | Status tidak berubah |

#### EP02.US05 – Otomatis dibatalkan setelah 3 hari

**Sebagai** sistem, **saya ingin** membatalkan transaksi yang tidak dikonfirmasi organizer dalam 3 hari, **agar** customer tidak menunggu tanpa kepastian.

| No | Given | When | Then |
|---|---|---|---|
| 1 | `WAITING_CONFIRMATION` lebih dari 3 hari | Job berjalan atau transaksi dibuka | Status menjadi `CANCELED` dan rollback dijalankan |

#### EP02.US06 – Rollback dalam satu SQL transaction

**Sebagai** customer, **saya ingin** semua yang saya pakai kembali jika transaksi gagal, **agar** saya tidak rugi.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Transaksi memakai voucher, kupon, dan poin | Status menjadi `EXPIRED`, `CANCELED`, atau `REJECTED` | Kursi bertambah lagi, kuota voucher kembali, kupon bisa dipakai lagi, dan poin kembali ke baris asalnya |
| 2 | Rollback dipicu dua kali (job dan organizer bersamaan) | Proses berjalan | Rollback hanya terjadi sekali |

### EP03 – Ulasan & Rating

| Epic | Prioritas | Peran | Estimasi |
|---|---|---|---|
| EP03 | Must | Customer, Guest | 1 hari |

#### EP03.US01 – Ulasan setelah menghadiri acara

**Sebagai** customer, **saya ingin** memberi rating dan ulasan setelah acara selesai, **agar** orang lain tahu kualitas acaranya.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Customer punya transaksi `DONE` dan acara sudah selesai | Mengirim rating 1–5 dan komentar | Ulasan tersimpan dan tampil di halaman acara |
| 2 | Acara belum selesai | Mengirim ulasan | Muncul pesan "Ulasan bisa diberikan setelah acara selesai" |
| 3 | Customer bukan peserta | Mengirim ulasan | Ditolak dengan pesan hanya untuk peserta |
| 4 | Customer sudah pernah mengulas acara ini | Mengirim lagi | Muncul pesan sudah memberi ulasan |

#### EP03.US02 – Rating di profil organizer

**Sebagai** pengunjung, **saya ingin** melihat rating organizer, **agar** yakin sebelum membeli.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Organizer punya ulasan 5 dan 4 | Profil organizer dibuka | Tampil rata-rata 4,5 dari 2 ulasan, sebaran bintang, daftar ulasan, dan acara mendatangnya |

### EP04 – Autentikasi & Otorisasi

| Epic | Prioritas | Peran | Estimasi |
|---|---|---|---|
| EP04 | Must | Guest, Customer, Organizer | 2 hari |

#### EP04.US01 – Registrasi dengan peran

**Sebagai** pengunjung, **saya ingin** mendaftar sebagai customer atau organizer, **agar** bisa memakai fitur sesuai kebutuhan.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Data valid | Klik "Daftar" | Akun dibuat dan langsung login |
| 2 | Email sudah terdaftar | Klik "Daftar" | Muncul pesan "Email sudah terdaftar" |
| 3 | Password kurang dari 8 karakter | Klik "Daftar" | Muncul pesan validasi |

#### EP04.US02 – Kode referral otomatis

**Sebagai** user baru, **saya ingin** langsung punya kode referral, **agar** bisa mengajak teman.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Registrasi berhasil | Akun dibuat | Kode referral 8 karakter yang unik dibuat otomatis |
| 2 | User membuka profil | Melihat kode referral | Kode hanya bisa disalin, tidak ada cara untuk mengubahnya |

#### EP04.US03 – Login dan protected route

**Sebagai** user, **saya ingin** hanya bisa membuka halaman sesuai peran saya, **agar** data aman.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Email dan password benar | Login | Masuk ke beranda (customer) atau dashboard (organizer) |
| 2 | Belum login | Membuka halaman checkout atau dashboard | Diarahkan ke login |
| 3 | Customer membuka dashboard organizer | Halaman dibuka | Tampil halaman "tidak punya akses", dan API menjawab 403 |

#### EP04.US04 – Lupa dan reset password

**Sebagai** user, **saya ingin** mereset password lewat email, **agar** bisa masuk lagi tanpa bantuan siapa pun.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Email terdaftar | Klik "Kirim link reset" | Email berisi link yang berlaku 1 jam terkirim |
| 2 | Email tidak terdaftar | Klik "Kirim link reset" | Pesan yang tampil sama persis (tidak membocorkan email mana yang terdaftar) |
| 3 | Link sudah dipakai atau kedaluwarsa | Menyimpan password baru | Muncul pesan "Link reset tidak valid atau sudah kedaluwarsa" |

### EP05 – Referral, Hadiah & Profil

| Epic | Prioritas | Peran | Estimasi |
|---|---|---|---|
| EP05 | Must | Customer, Organizer | 2 hari |

#### EP05.US01 – Hadiah referral

**Sebagai** customer, **saya ingin** mendapat hadiah dari program referral, **agar** tertarik mengajak teman.

| No | Given | When | Then |
|---|---|---|---|
| 1 | User baru mendaftar dengan kode referral valid | Registrasi berhasil | User baru dapat kupon 10% (maks Rp 50.000), pemilik kode dapat 10.000 poin |
| 2 | Tiga orang memakai kode yang sama | Ketiganya terdaftar | Saldo poin pemilik kode 30.000 |
| 3 | Kode referral tidak ditemukan | Klik "Daftar" | Registrasi ditolak dan tidak ada akun yang dibuat |

#### EP05.US02 – Masa berlaku poin dan kupon

**Sebagai** customer, **saya ingin** tahu kapan poin dan kupon saya hangus, **agar** sempat memakainya.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Poin diterima 28 Des 2023 | Saldo dihitung | Poin berlaku sampai 28 Mar 2024, setelah itu tidak dihitung |
| 2 | Kupon referral diterima | 3 bulan berlalu | Kupon berstatus kedaluwarsa dan tidak bisa dipakai |
| 3 | Poin dipakai | Checkout | Poin yang paling cepat kedaluwarsa dipakai lebih dulu |

#### EP05.US03 – Halaman poin dan kupon

**Sebagai** customer, **saya ingin** melihat kode referral, saldo poin, dan kupon saya di satu halaman.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Customer membuka "Poin & Kupon" | Halaman dimuat | Tampil kode referral dengan tombol salin, saldo poin, riwayat poin dengan tanggal kedaluwarsa, dan kupon dengan status Aktif, Terpakai, atau Kedaluwarsa |

#### EP05.US04 – Edit profil dan ganti password

**Sebagai** user, **saya ingin** mengubah nama, foto, bio, dan password saya.

| No | Given | When | Then |
|---|---|---|---|
| 1 | User mengganti nama dan foto | Klik "Simpan" | Profil diperbarui dan foto baru tampil di navbar |
| 2 | Password lama salah | Klik "Ubah password" | Muncul pesan "Password lama salah" |

### EP06 – Dashboard Organizer

| Epic | Prioritas | Peran | Estimasi |
|---|---|---|---|
| EP06 | Must | Organizer | 3 hari |

#### EP06.US01 – Ringkasan dashboard

**Sebagai** organizer, **saya ingin** melihat ringkasan penjualan, **agar** tahu kondisi acara saya sekilas.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Organizer membuka dashboard | Halaman dimuat | Tampil total acara, tiket terjual, pendapatan, dan jumlah transaksi yang menunggu konfirmasi |

#### EP06.US02 – Statistik per tahun, bulan, dan hari

**Sebagai** organizer, **saya ingin** melihat grafik penjualan per periode, **agar** bisa mengevaluasi acara.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Organizer memilih "Bulan" dan tahun 2026 | Grafik dimuat | Batang pendapatan Jan sampai Des 2026 tampil, hanya dari transaksi `DONE` |
| 2 | Memilih "Hari" pada bulan Februari | Grafik dimuat | Tampil 28 batang, satu per tanggal |
| 3 | Memilih satu acara di filter | Grafik dimuat | Hanya penjualan acara tersebut yang dihitung |

#### EP06.US03 – Terima atau tolak transaksi

**Sebagai** organizer, **saya ingin** melihat bukti bayar lalu menerima atau menolaknya.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Transaksi `WAITING_CONFIRMATION` | Organizer membuka detail | Gambar bukti bayar tampil (hanya untuk organizer acara dan pembelinya) |
| 2 | Bukti valid | Klik "Terima" lalu konfirmasi | Status menjadi `DONE` |
| 3 | Bukti tidak valid | Klik "Tolak" lalu konfirmasi | Status menjadi `REJECTED` dan rollback dijalankan |
| 4 | Transaksi milik acara organizer lain | Mencoba menerima | Ditolak |

#### EP06.US04 – Email notifikasi ke customer

**Sebagai** customer, **saya ingin** mendapat email saat pembayaran saya diterima atau ditolak.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Organizer menerima transaksi | Status menjadi `DONE` | Customer menerima email "Pembayaran diterima" |
| 2 | Organizer menolak transaksi | Status menjadi `REJECTED` | Customer menerima email "Pembayaran ditolak" yang menyebutkan poin, voucher, dan kupon sudah dikembalikan |
| 3 | Server email gagal | Organizer menerima/menolak | Status tetap tersimpan, dan kegagalan email hanya dicatat di log |

#### EP06.US05 – Daftar peserta

**Sebagai** organizer, **saya ingin** melihat daftar peserta tiap acara.

| No | Given | When | Then |
|---|---|---|---|
| 1 | Budi membeli 2 tiket lalu 1 tiket (keduanya `DONE`) | Daftar peserta dibuka | Budi tampil sekali dengan jumlah 3 tiket dan total yang dibayar |
| 2 | Belum ada transaksi `DONE` | Daftar peserta dibuka | Tampil pesan "Belum ada peserta" |

## 8. Kebutuhan non-fungsional

| Atribut kualitas (ISO/IEC 25010) | Kebutuhan | Target terukur |
|---|---|---|
| Kesesuaian fungsional | Aturan harga, poin, dan status dihitung di server | Semua unit test lulus |
| Keandalan | Perubahan multi-tabel memakai SQL transaction; status otomatis tetap benar walau server sempat mati | 0 data setengah jadi pada test rollback |
| Keamanan | Password bcrypt, JWT 1 hari, cek peran dan kepemilikan di setiap endpoint, bukti bayar privat | Test 401/403 lulus |
| Kemudahan penggunaan | Responsif, dialog konfirmasi pada aksi yang mengubah data, pesan error berbahasa Indonesia | 360 px sampai 1440 px tanpa scroll horizontal |
| Kinerja | Pencarian memakai debounce, daftar acara berpaginasi 12 per halaman | Satu request per jeda ketik |
| Kemudahan pemeliharaan | Lapisan route, controller, dan service; validasi dengan zod | Logika bisnis hanya di service |
| Portabilitas | API dibungkus Docker, konfigurasi lewat environment variable | Jalan di laptop dan di hosting |

## 9. Desain pengalaman & antarmuka

### 9.1 Alur pengguna

**Customer**

1. Buka beranda, cari atau filter acara, lalu buka detail acara.
2. Pilih jenis dan jumlah tiket, lalu klik "Beli Tiket". Kalau belum login, diarahkan ke login dulu.
3. Di halaman checkout, isi voucher, pilih kupon, aktifkan poin, lalu klik "Bayar Sekarang".
4. Halaman pembayaran menampilkan hitung mundur 2 jam. Upload bukti transfer.
5. Tunggu konfirmasi, lalu terima email hasilnya.
6. Setelah acara selesai, klik "Beri Ulasan" di halaman Tiket Saya.

**Organizer**

1. Login, lalu masuk ke dashboard.
2. Buat acara dengan jenis tiketnya, lalu buat voucher.
3. Buka menu Transaksi (tab "Menunggu Konfirmasi"), lihat bukti bayar, lalu terima atau tolak.
4. Pantau grafik penjualan dan daftar peserta.

**Cabang error**: kursi habis, voucher tidak berlaku, waktu pembayaran habis (status kedaluwarsa), dan link reset kedaluwarsa. Masing-masing punya pesan yang jelas.

### 9.2 Peta halaman

| Halaman | URL | Akses |
|---|---|---|
| Beranda | `/` | Publik |
| Jelajah | `/events` | Publik |
| Detail acara | `/events/:slug` | Publik |
| Profil organizer | `/organizers/:id` | Publik |
| Masuk, Daftar | `/login`, `/register` | Guest |
| Lupa & reset password | `/forgot-password`, `/reset-password` | Guest |
| Checkout | `/checkout` | Customer |
| Pembayaran / detail transaksi | `/transactions/:id` | Customer |
| Tiket saya | `/my-tickets` | Customer |
| Poin & kupon | `/rewards` | Customer |
| Pengaturan akun | `/settings` | Login |
| Dashboard | `/organizer` | Organizer |
| Acara saya, buat/edit acara | `/organizer/events`, `/organizer/events/new`, `/organizer/events/:id/edit` | Organizer |
| Voucher | `/organizer/vouchers` | Organizer |
| Transaksi | `/organizer/transactions` | Organizer |
| Peserta | `/organizer/events/:id/attendees` | Organizer |

### 9.3 Desain UI per halaman

Pokok-pokok desain tiap halaman:

- Kartu acara dengan gambar 16:9, chip kategori, judul, tanggal, kota, dan harga mulai.
- Detail acara dengan kartu pemilih tiket yang menempel di sisi kanan (desktop) atau di bawah layar (HP).
- Halaman pembayaran dengan hitung mundur besar dan area upload.
- Dashboard organizer dengan sidebar, kartu ringkasan, dan grafik batang.

### 9.4 Design system

- Warna: teal `#0F766E` (utama), amber `#F59E0B` (harga/promo), abu-abu slate (netral).
- Font: Plus Jakarta Sans.
- Sudut: kartu 12 px, input dan tombol 8 px.
- Warna badge status: amber (menunggu pembayaran), biru (menunggu konfirmasi), hijau (selesai), merah (ditolak), abu-abu (kedaluwarsa dan dibatalkan).
- Ikon: lucide.

### 9.5 Aksesibilitas & bahasa

- Bahasa Indonesia; harga dalam format "Rp 150.000"; waktu dalam WIB.
- Setiap input punya label; tombol yang hanya berisi ikon punya `aria-label`.
- Kontras warna teks utama memenuhi WCAG AA.

## 10. Arsitektur & desain API

### 10.1 Konteks sistem (C4 level 1)

- **Pengguna**: Guest, Customer, Organizer
- **Aplikasi web**: frontend React yang dibuka di browser HP dan laptop
- **API Gelar**: menyimpan data dan menjalankan aturan bisnis
- **Sistem eksternal**: Server email (SMTP)

### 10.2 Diagram container (C4 level 2)

| Container | Teknologi | Tanggung jawab | Komunikasi |
|---|---|---|---|
| Frontend web | React, Vite, TailwindCSS, Axios | Tampilan, protected route, debounce pencarian | Backend API |
| Backend API | Node.js, Express, Prisma | Aturan bisnis, autentikasi JWT, upload file, scheduler status | Database PostgreSQL, Server email |
| Database PostgreSQL | PostgreSQL 16 | Data acara, transaksi, poin, file gambar | - |
| Server email | SMTP (nodemailer) | Email hasil transaksi dan reset password | - |

### 10.3 Model data (ERD)

Detail lengkap ada di `docs/03-database.md`.

- **User** (1–N) **Event** sebagai organizer
- **User** (1–N) **Point**
- **User** (1–N) **Coupon**
- **User** (1–N) **Transaction**
- **User** (1–N) **Review**
- **Category** (1–N) **Event**
- **Event** (1–N) **TicketType**
- **Event** (1–N) **Voucher**
- **Event** (1–N) **Transaction**
- **Transaction** (1–N) **TransactionItem**
- **Transaction** (1–N) **PointUsage**
- **Point** (1–N) **PointUsage**

**Transaction**

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | int | PK |
| invoice | string | unik, contoh INV-20261109-AB12CD |
| user_id | int | FK ke users (pembeli) |
| event_id | int | FK ke events |
| status | enum | 6 status transaksi |
| subtotal, voucher_discount, coupon_discount, points_used, total | int | Rupiah |
| payment_deadline | datetime | dibuat + 2 jam |
| confirm_deadline | datetime | upload bukti + 3 hari |

**Point**

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | int | PK |
| user_id | int | FK ke users |
| amount | int | poin awal |
| remaining | int | sisa poin |
| expires_at | datetime | diterima + 3 bulan |

### 10.4 Endpoint API

Daftar lengkap ada di `docs/05-api.md`. Endpoint utama:

| Metode | Endpoint | Fungsi | Peran |
|---|---|---|---|
| POST | /api/auth/register | Registrasi (+ referral) | Publik |
| POST | /api/auth/login | Login, mengembalikan JWT | Publik |
| GET | /api/events | Daftar acara mendatang `?search=&category=&city=&price=&page=` | Publik |
| GET | /api/events/:slug | Detail acara | Publik |
| POST | /api/events | Buat acara (multipart) | Organizer |
| POST | /api/transactions | Checkout `{ eventId, items[], voucherCode?, couponId?, usePoints }` | Customer |
| POST | /api/transactions/:id/proof | Upload bukti bayar | Customer |
| POST | /api/dashboard/transactions/:id/accept | Terima | Organizer |
| POST | /api/dashboard/transactions/:id/reject | Tolak + rollback | Organizer |
| GET | /api/dashboard/stats | Grafik `?period=year,month,day&year=&month=&eventId=` | Organizer |

Format error selalu `{ "message": "..." }` dengan kode 400, 401, 403, 404, atau 409.

## 11. Spesifikasi frontend

- React + Vite, routing `react-router-dom`, dan komponen `ProtectedRoute` per peran.
- State login disimpan di Context (`AuthContext`); toast dan dialog konfirmasi disediakan `UiContext`.
- Axios dengan interceptor yang menempelkan token JWT.
- Hook `useDebounce` (500 ms) untuk pencarian dan `useFetch` untuk mengambil data.
- TailwindCSS untuk tampilan responsif; grafik dibuat sendiri dengan elemen HTML tanpa library chart.
- Setiap daftar punya empty state, dan setiap aksi yang mengubah data memakai dialog konfirmasi.

## 12. Spesifikasi backend

- Express 5 dengan lapisan `routes`, `controllers`, `services`, dan `middlewares`.
- Prisma ORM ke PostgreSQL. `prisma.$transaction` dipakai di registrasi referral, checkout, upload bukti, rollback, edit acara, dan reset password.
- Kursi dikurangi lewat update bersyarat (`available >= qty`) untuk mencegah oversell.
- Scheduler `setInterval` tiap menit, ditambah pengecekan saat transaksi dibaca.
- File disimpan di tabel `files` dan dilayani lewat `/api/files/:id`. Bukti bayar bersifat privat.
- Validasi input dengan zod. Error terpusat di satu error handler.
- Pengujian dengan Jest + Supertest pada database test terpisah.

## 13. Keamanan & privasi

- Password di-hash dengan bcrypt dan tidak pernah dikirim di response.
- JWT HS256 berlaku 1 hari dan disimpan di localStorage browser.
- Setiap endpoint memeriksa peran (`authorize`) dan kepemilikan data, misalnya acara milik organizer atau transaksi milik customer.
- Bukti bayar hanya bisa dibuka pembeli dan organizer acaranya.
- Token reset password disimpan dalam bentuk hash, berlaku 1 jam, dan hanya sekali pakai. Response lupa password tidak membocorkan email mana yang terdaftar.
- Upload dibatasi 2 MB dan hanya untuk tipe gambar.
- Harga selalu dihitung ulang di server.
- Rahasia (JWT secret, kredensial database dan SMTP) disimpan di environment variable, bukan di repository.

## 14. Strategi pengujian

| Jenis uji | Cakupan | Alat | Penanggung jawab | Kriteria lulus |
|---|---|---|---|---|
| Unit | Perhitungan harga (voucher, kupon, poin) | Jest | Developer | Semua lulus |
| Integrasi API | Auth, referral, acara, voucher, checkout, rollback, status otomatis, konfirmasi, ulasan, statistik, peserta | Jest + Supertest + PostgreSQL test | Developer | Semua lulus |
| Manual / UAT | Alur customer dan organizer di browser desktop dan HP | Checklist dari bab 7 | Developer, mentor | Semua acceptance criteria terpenuhi |

### 14.1 Test case utama

| ID | Terkait AC | Langkah | Hasil yang diharapkan |
|---|---|---|---|
| TC-01 | EP02.US01 #1 | Tiket Rp 300.000, poin 20.000, checkout dengan poin | Total Rp 280.000 |
| TC-02 | EP02.US01 #4 | Dua checkout bersamaan untuk kursi terakhir | Satu berhasil (201), satu ditolak (400) |
| TC-03 | EP02.US04 #1 | Jalankan job dengan waktu +2,1 jam | Status `EXPIRED` dan kursi serta poin kembali |
| TC-04 | EP02.US05 #1 | Upload bukti lalu jalankan job dengan waktu +3,1 hari | Status `CANCELED` |
| TC-05 | EP06.US03 #3 | Organizer menolak transaksi yang memakai kupon | `REJECTED`, kupon aktif lagi, dan email terkirim |
| TC-06 | EP05.US01 #2 | Tiga user mendaftar dengan kode yang sama | Saldo pemilik kode 30.000 |
| TC-07 | EP04.US03 #3 | Customer memanggil `/api/dashboard/summary` | 403 |
| TC-08 | EP03.US01 #2 | Ulasan untuk acara yang belum selesai | 400 |

## 15. Deployment & infrastruktur

- **Development**: PostgreSQL di Docker (`docker compose up -d`), API di port 8000, web di port 5173.
- **Production**: frontend sebagai file statis hasil `vite build`, API sebagai container Docker, dan PostgreSQL terkelola dari penyedia hosting. Penyedia final dipilih di tahap deploy dengan prioritas paket gratis.
- **Migrasi**: `prisma migrate deploy` dijalankan saat container API start.
- **Repository**: GitHub. Konfigurasi rahasia hanya di environment variable hosting.

## 16. Operasional & dukungan

- Log API ditulis ke console dan dibaca dari dashboard hosting.
- Endpoint `/api/health` dipakai untuk mengecek apakah API hidup.
- Data demo bisa dipulihkan dengan `npm run db:seed`.
- User bisa mereset password sendiri tanpa bantuan admin.

## 17. Rencana rilis & SDLC

Dikerjakan satu orang secara bertahap:

| Tahap | Hasil | Status |
|---|---|---|
| 1. Analisis & arsitektur | Dokumen 01–05 | Selesai |
| 2. Desain UI | Desain per halaman | Berjalan |
| 3. Development | API + web | Berjalan |
| 4. Testing | Unit/integrasi test + uji manual responsif | Berjalan |
| 5. Deploy | Repository GitHub dan URL live | Belum |

## 18. Risiko & mitigasi

| Risiko | Dampak | Kemungkinan | Mitigasi | Pemilik |
|---|---|---|---|---|
| Dua pembeli berebut kursi terakhir | Oversell | Sedang | Update bersyarat di dalam SQL transaction, dan ada test-nya | Developer |
| Server hosting gratis "tidur" sehingga job tidak berjalan | Status terlambat berubah | Tinggi | Status juga dicek setiap kali transaksi dibaca | Developer |
| Email gagal terkirim | Customer tidak tahu hasilnya | Sedang | Status tetap tersimpan, kegagalan dicatat, dan hasil juga terlihat di Tiket Saya | Developer |
| Database penuh karena gambar | Upload gagal | Rendah | Batas 2 MB per file; untuk skala besar pindah ke object storage | Developer |
| Waktu pengerjaan terbatas (sendiri) | Fitur tidak selesai | Sedang | Prioritas mengikuti poin brief, dikerjakan per tahap | Developer |

## 19. Dependensi & pertanyaan terbuka

**Dependensi**: Node.js 24, Express 5, Prisma 6, PostgreSQL 16, React 19, Vite, TailwindCSS 4, Axios, Jest, Docker, GitHub.

**Pertanyaan terbuka**

1. Penyedia hosting production (diputuskan di tahap deploy).
2. Akun SMTP untuk production (misalnya Gmail App Password).

## 20. Glosarium

- **Voucher**: kode potongan dari organizer, hanya untuk acara tertentu miliknya.
- **Kupon**: potongan dari sistem (hadiah referral), berlaku untuk semua acara.
- **Poin**: saldo dari referral yang mengurangi harga, berlaku 3 bulan.
- **Rollback**: pengembalian kursi, voucher, kupon, dan poin saat transaksi gagal.
- **SQL transaction**: beberapa perubahan database yang berhasil semua atau batal semua.
- **Debounce**: menunda pencarian sampai user berhenti mengetik.
- **Protected route**: halaman yang hanya bisa dibuka user dengan peran tertentu.
- **JWT**: token login yang dikirim di setiap request.
