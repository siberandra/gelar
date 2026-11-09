# 03 — Desain Database

## 1. ERD

```mermaid
erDiagram
    users ||--o{ users : "mereferensikan"
    users ||--o{ events : "membuat (organizer)"
    users ||--o{ points : "memiliki"
    users ||--o{ coupons : "memiliki"
    users ||--o{ transactions : "membeli"
    users ||--o{ reviews : "menulis"
    users ||--o{ password_resets : ""
    categories ||--o{ events : ""
    events ||--|{ ticket_types : "punya"
    events ||--o{ vouchers : "punya"
    events ||--o{ transactions : ""
    events ||--o{ reviews : ""
    transactions ||--|{ transaction_items : "berisi"
    ticket_types ||--o{ transaction_items : ""
    transactions ||--o{ point_usages : "memakai"
    points ||--o{ point_usages : ""
    vouchers |o--o{ transactions : "dipakai di"
    coupons |o--o| transactions : "dipakai di"

    users {
        int id PK
        string name
        string email UK
        string password "hash bcrypt"
        enum role "CUSTOMER | ORGANIZER"
        string referral_code UK
        int referred_by_id FK "nullable"
        int avatar_file_id FK "nullable"
        string bio "nullable"
    }
    points {
        int id PK
        int user_id FK
        int amount "poin awal"
        int remaining "sisa"
        datetime expires_at
    }
    coupons {
        int id PK
        int user_id FK
        string code UK
        int percent "10"
        int max_discount "50000"
        datetime expires_at
        datetime used_at "nullable"
    }
    categories {
        int id PK
        string name
        string slug UK
    }
    events {
        int id PK
        int organizer_id FK
        int category_id FK
        string title
        string slug UK
        text description
        string city
        string venue
        int image_file_id FK
        datetime start_date
        datetime end_date
    }
    ticket_types {
        int id PK
        int event_id FK
        string name "Reguler, VIP"
        int price "Rupiah, 0 = gratis"
        int quota
        int available
    }
    vouchers {
        int id PK
        int event_id FK
        string code
        int discount "Rupiah"
        int quota
        int used
        datetime start_date
        datetime end_date
    }
    transactions {
        int id PK
        string invoice UK
        int user_id FK
        int event_id FK
        enum status
        int subtotal
        int voucher_id FK "nullable"
        int voucher_discount
        int coupon_id FK "nullable"
        int coupon_discount
        int points_used
        int total
        int proof_file_id FK "nullable"
        datetime payment_deadline
        datetime confirm_deadline "nullable"
    }
    transaction_items {
        int id PK
        int transaction_id FK
        int ticket_type_id FK
        int quantity
        int unit_price "harga saat beli"
    }
    point_usages {
        int id PK
        int transaction_id FK
        int point_id FK
        int amount
    }
    reviews {
        int id PK
        int user_id FK
        int event_id FK
        int rating "1-5"
        text comment
    }
    password_resets {
        int id PK
        int user_id FK
        string token_hash
        datetime expires_at
        datetime used_at "nullable"
    }
    files {
        int id PK
        string mime_type
        bytes data
    }
```

Semua tabel juga punya `created_at` (dan `updated_at` jika datanya bisa diubah). Tidak saya tulis di diagram supaya tidak terlalu ramai.

## 2. Penjelasan keputusan desain

**Kenapa poin disimpan per baris, bukan satu kolom `saldo` di tabel user?**
Karena setiap tambahan poin punya tanggal kedaluwarsa sendiri (BR-08). Dengan per baris:
- saldo = `SUM(remaining) WHERE expires_at > now()`,
- poin kedaluwarsa otomatis tidak terhitung tanpa perlu job penghapus.

**Kenapa ada tabel `point_usages`?**
Untuk rollback yang tepat. Jika transaksi memakai 15.000 poin yang diambil dari dua baris berbeda, tabel ini mencatat "baris A dipakai 10.000, baris B dipakai 5.000". Saat rollback, angka itu dikembalikan ke baris yang sama.

**Kenapa `unit_price` disimpan di `transaction_items`?**
Organizer bisa mengubah harga tiket setelah ada yang membeli. Harga di transaksi harus tetap harga saat pembelian.

**Kenapa potongan voucher/kupon disimpan sebagai angka di transaksi?**
Sama alasannya: riwayat transaksi tidak boleh berubah walaupun voucher diedit. Selain itu, laporan pendapatan cukup membaca `total`.

**Kenapa `available` terpisah dari `quota`?**
`quota` = kapasitas awal, `available` = sisa saat ini. Jumlah terjual = `quota − available`, berguna untuk statistik.

## 3. Constraint dan index

| Tabel | Constraint / index | Tujuan |
|---|---|---|
| users | UNIQUE(email), UNIQUE(referral_code) | Tidak ada email atau kode ganda |
| vouchers | UNIQUE(event_id, code) | Kode voucher unik per acara |
| reviews | UNIQUE(user_id, event_id) | BR-16, satu ulasan per acara |
| transactions | INDEX(status, payment_deadline), INDEX(status, confirm_deadline) | Query job otomatis tetap cepat |
| events | INDEX(start_date), INDEX(category_id), INDEX(city) | Filter di halaman jelajah |
| points | INDEX(user_id, expires_at) | Hitung saldo |

## 4. Status transaksi (enum)

```
WAITING_PAYMENT | WAITING_CONFIRMATION | DONE | REJECTED | EXPIRED | CANCELED
```
