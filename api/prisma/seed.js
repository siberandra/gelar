// Data contoh untuk development dan demo. Jalankan: npm run db:seed
// Semua akun demo memakai password: password123
process.env.TZ = process.env.TZ || "Asia/Jakarta";
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { addDays, addHours, addMonths } = require("../src/utils/date");

const prisma = new PrismaClient();
const now = new Date();
const at = (days, hour = 19) => {
  const d = addDays(now, days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const categories = [
  { name: "Musik", slug: "musik" },
  { name: "Seminar", slug: "seminar" },
  { name: "Workshop", slug: "workshop" },
  { name: "Olahraga", slug: "olahraga" },
  { name: "Kuliner", slug: "kuliner" },
  { name: "Teknologi", slug: "teknologi" },
];

const organizers = [
  { name: "Soundwave Production", email: "soundwave@gelar.id", bio: "Promotor konser dan festival musik independen sejak 2015.", code: "SOUNDWV1" },
  { name: "Ruang Belajar Nusantara", email: "ruangbelajar@gelar.id", bio: "Komunitas seminar dan workshop pengembangan diri.", code: "RUANGBLJ" },
  { name: "Lari Bareng Indonesia", email: "laribareng@gelar.id", bio: "Penyelenggara fun run dan acara olahraga komunitas.", code: "LARIBRNG" },
];

const customers = [
  { name: "Budi Santoso", email: "budi@gelar.id", code: "BUDI2026" },
  { name: "Siti Rahma", email: "siti@gelar.id", code: "SITI2026", ref: "BUDI2026" },
  { name: "Andi Pratama", email: "andi@gelar.id", code: "ANDI2026", ref: "BUDI2026" },
  { name: "Dewi Lestari", email: "dewi@gelar.id", code: "DEWI2026", ref: "BUDI2026" },
  { name: "Rizky Maulana", email: "rizky@gelar.id", code: "RIZKY026" },
];

// [organizer, kategori, judul, kota, tempat, hari dari sekarang, durasi jam, tiket [nama, harga, kuota]]
const events = [
  [0, "musik", "Jakarta Indie Music Fest 2026", "Jakarta", "Istora Senayan", 33, 7, [["Presale", 150000, 200], ["Reguler", 200000, 300], ["VIP", 450000, 50]]],
  [0, "musik", "Akustik Senja di Braga", "Bandung", "Braga Citywalk", 12, 3, [["Reguler", 85000, 120]]],
  [0, "musik", "Jazz Malam Minggu", "Yogyakarta", "Taman Budaya Yogyakarta", 20, 4, [["Reguler", 120000, 150], ["VIP", 250000, 30]]],
  [0, "musik", "Surabaya Rock Night", "Surabaya", "Grand City Convention Hall", 45, 5, [["Festival", 175000, 400]]],
  [0, "kuliner", "Festival Kuliner Nusantara", "Medan", "Lapangan Merdeka Medan", 9, 10, [["Tiket Masuk", 25000, 1000]]],
  [1, "seminar", "Seminar Karier: Masuk Dunia Tech Tanpa Gelar IT", "Jakarta", "Gedung Cyber 2", 6, 3, [["Umum", 75000, 150], ["Mahasiswa", 50000, 100]]],
  [1, "workshop", "Workshop Public Speaking untuk Introvert", "Bandung", "Co-working Ruang Kolaborasi", 14, 4, [["Reguler", 125000, 40]]],
  [1, "teknologi", "Belajar React dari Nol", "Yogyakarta", "Jogja Digital Valley", 18, 6, [["Peserta", 0, 80]]],
  [1, "seminar", "Literasi Keuangan untuk Gen Z", "Surabaya", "Universitas Airlangga, Aula Garuda Mukti", 25, 3, [["Gratis", 0, 300]]],
  [1, "workshop", "Kelas Fotografi Ponsel", "Bali", "Ubud Creative Space", 28, 4, [["Reguler", 150000, 25]]],
  [2, "olahraga", "Jakarta Fun Run 5K", "Jakarta", "Gelora Bung Karno", 16, 4, [["5K", 175000, 500], ["5K + Jersey", 275000, 200]]],
  [2, "olahraga", "Bandung Sunrise Ride", "Bandung", "Gedung Sate", 22, 4, [["Peserta", 100000, 150]]],
  [2, "olahraga", "Yoga Pagi di Pantai Sanur", "Bali", "Pantai Sanur", 8, 2, [["Peserta", 60000, 60]]],
  [2, "olahraga", "Medan City Marathon", "Medan", "Lapangan Benteng", 60, 6, [["10K", 225000, 300], ["Half Marathon", 325000, 200]]],
];

// Acara yang sudah lewat, untuk statistik, profil organizer, dan ulasan
const pastEvents = [
  [0, "musik", "Konser Amal Akhir Tahun 2025", "Jakarta", "Balai Sarbini", -320, 4, [["Reguler", 150000, 300]]],
  [1, "workshop", "Workshop Desain UI untuk Pemula", "Bandung", "Ruang Kolaborasi", -150, 5, [["Reguler", 100000, 50]]],
  [2, "olahraga", "Night Run Surabaya", "Surabaya", "Taman Bungkul", -60, 3, [["5K", 150000, 300]]],
  [0, "musik", "Pesta Musik Pantai", "Bali", "Pantai Kuta", -20, 6, [["Reguler", 200000, 200]]],
];

const descriptions = {
  musik: "Nikmati penampilan musisi lokal terbaik dalam suasana yang hangat. Datang lebih awal untuk mendapatkan posisi terbaik dan jangan lupa membawa identitas saat penukaran tiket.",
  seminar: "Seminar interaktif bersama praktisi berpengalaman. Peserta mendapat materi, sesi tanya jawab, dan e-sertifikat setelah acara.",
  workshop: "Kelas praktik dengan jumlah peserta terbatas supaya setiap orang mendapat perhatian dari mentor. Bawa laptop atau ponsel sesuai kebutuhan materi.",
  olahraga: "Acara olahraga komunitas untuk semua level. Termasuk race pack, air mineral, dan medali untuk peserta yang menyelesaikan rute.",
  kuliner: "Puluhan tenant kuliner dari berbagai daerah di Indonesia berkumpul dalam satu tempat. Cocok untuk dinikmati bersama keluarga dan teman.",
  teknologi: "Sesi belajar langsung praktik dari dasar sampai membuat proyek kecil. Cocok untuk pemula yang ingin mulai belajar pemrograman.",
};

function slug(title, i) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${String(i).padStart(2, "0")}`;
}

async function main() {
  console.log("Menghapus data lama...");
  await prisma.$transaction([
    prisma.pointUsage.deleteMany(),
    prisma.transactionItem.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.review.deleteMany(),
    prisma.voucher.deleteMany(),
    prisma.ticketType.deleteMany(),
    prisma.event.deleteMany(),
    prisma.category.deleteMany(),
    prisma.point.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.passwordReset.deleteMany(),
    prisma.user.deleteMany(),
    prisma.file.deleteMany(),
  ]);

  const password = await bcrypt.hash("password123", 10);
  await prisma.category.createMany({ data: categories });
  const categoryId = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  const orgUsers = [];
  for (const o of organizers) {
    orgUsers.push(
      await prisma.user.create({
        data: { name: o.name, email: o.email, password, role: "ORGANIZER", referralCode: o.code, bio: o.bio },
      })
    );
  }

  const custUsers = {};
  for (const c of customers) {
    const referrer = c.ref ? custUsers[c.ref] : null;
    const user = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        password,
        role: "CUSTOMER",
        referralCode: c.code,
        referredById: referrer ? referrer.id : null,
      },
    });
    custUsers[c.code] = user;
    if (referrer) {
      // Sama seperti alur registrasi: kupon untuk user baru, 10.000 poin untuk pemilik kode
      await prisma.coupon.create({
        data: { userId: user.id, code: `REF-${c.code}`, percent: 10, maxDiscount: 50000, expiresAt: addMonths(now, 3) },
      });
      await prisma.point.create({
        data: { userId: referrer.id, amount: 10000, remaining: 10000, source: `Referral dari ${c.name}`, expiresAt: addMonths(now, 3) },
      });
    }
  }
  // Contoh poin yang sudah kedaluwarsa, supaya tampilan riwayat poin lengkap
  await prisma.point.create({
    data: { userId: custUsers.BUDI2026.id, amount: 10000, remaining: 10000, source: "Referral dari Rina", expiresAt: addDays(now, -10), createdAt: addMonths(addDays(now, -10), -3) },
  });

  const created = [];
  const all = [...events.map((e) => [...e, false]), ...pastEvents.map((e) => [...e, true])];
  for (const [i, [org, cat, title, city, venue, days, hours, tickets]] of all.entries()) {
    const startDate = at(days, cat === "olahraga" ? 6 : 19);
    created.push(
      await prisma.event.create({
        data: {
          organizerId: orgUsers[org].id,
          categoryId: categoryId[cat],
          title,
          slug: slug(title, i),
          description: descriptions[cat],
          city,
          venue,
          startDate,
          endDate: addHours(startDate, hours),
          ticketTypes: {
            create: tickets.map(([name, price, quota]) => ({ name, price, quota, available: quota })),
          },
        },
        include: { ticketTypes: true },
      })
    );
  }

  // Voucher promo
  await prisma.voucher.createMany({
    data: [
      { eventId: created[0].id, code: "INDIEFEST", discount: 25000, quota: 100, startDate: addDays(now, -3), endDate: addDays(now, 20) },
      { eventId: created[5].id, code: "KARIER20", discount: 20000, quota: 50, startDate: addDays(now, -1), endDate: addDays(now, 5) },
      { eventId: created[10].id, code: "LARIHEMAT", discount: 30000, quota: 80, startDate: addDays(now, -2), endDate: addDays(now, 10) },
      { eventId: created[3].id, code: "ROCKEARLY", discount: 25000, quota: 50, startDate: addDays(now, 5), endDate: addDays(now, 30) },
    ],
  });

  // Transaksi contoh. Kursi dikurangi sesuai jumlah tiket supaya data konsisten.
  const buyers = Object.values(custUsers);
  let invoiceNo = 1;
  async function buy(event, buyer, qty, status, createdAt, extra = {}) {
    const ticket = event.ticketTypes[0];
    const subtotal = ticket.price * qty;
    await prisma.ticketType.update({ where: { id: ticket.id }, data: { available: { decrement: qty } } });
    const done = ["WAITING_PAYMENT", "WAITING_CONFIRMATION", "DONE"].includes(status);
    if (!done) {
      // Status gagal: kursi sudah dikembalikan (rollback)
      await prisma.ticketType.update({ where: { id: ticket.id }, data: { available: { increment: qty } } });
    }
    return prisma.transaction.create({
      data: {
        invoice: `INV-SEED-${String(invoiceNo++).padStart(4, "0")}`,
        userId: buyer.id,
        eventId: event.id,
        status,
        subtotal,
        total: subtotal,
        paymentDeadline: addHours(createdAt, 2),
        confirmDeadline: status === "WAITING_CONFIRMATION" ? addDays(createdAt, 3) : null,
        createdAt,
        items: { create: [{ ticketTypeId: ticket.id, quantity: qty, unitPrice: ticket.price }] },
        ...extra,
      },
    });
  }

  // Penjualan acara lampau tersebar di beberapa bulan (untuk grafik statistik)
  const past = created.slice(events.length);
  for (const [p, event] of past.entries()) {
    const startOffset = pastEvents[p][5];
    for (let k = 0; k < 10; k++) {
      const buyer = buyers[k % buyers.length];
      const createdAt = addDays(now, startOffset - 30 + k * 3);
      await buy(event, buyer, 1 + (k % 3), "DONE", createdAt);
    }
  }

  // Penjualan acara mendatang (bulan ini)
  for (const [e, event] of created.slice(0, 8).entries()) {
    for (let k = 0; k < 4; k++) {
      await buy(event, buyers[(e + k) % buyers.length], 1 + (k % 2), "DONE", addDays(now, -(k * 4 + e)));
    }
  }

  // Satu contoh untuk tiap status lainnya
  await buy(created[0], custUsers.SITI2026, 2, "WAITING_PAYMENT", addHours(now, -0.5));
  await buy(created[0], custUsers.ANDI2026, 1, "WAITING_CONFIRMATION", addHours(now, -5));
  await buy(created[10], custUsers.DEWI2026, 2, "WAITING_CONFIRMATION", addDays(now, -1));
  await buy(created[1], custUsers.RIZKY026, 1, "REJECTED", addDays(now, -6));
  await buy(created[2], custUsers.ANDI2026, 1, "EXPIRED", addDays(now, -4));
  await buy(created[5], custUsers.DEWI2026, 1, "CANCELED", addDays(now, -2));

  // Ulasan untuk acara yang sudah selesai
  const comments = [
    [5, "Acaranya seru banget, sound system mantap dan antrean masuk rapi."],
    [4, "Secara keseluruhan bagus, cuma parkirnya agak susah."],
    [5, "Materi jelas dan mentornya sabar menjawab pertanyaan."],
    [4, "Worth it untuk harganya. Semoga ada sesi lanjutan."],
    [3, "Lumayan, tapi acaranya mulai telat 30 menit."],
  ];
  for (const event of past) {
    const attendees = await prisma.transaction.findMany({
      where: { eventId: event.id, status: "DONE" },
      distinct: ["userId"],
      select: { userId: true },
    });
    for (const [k, a] of attendees.slice(0, 4).entries()) {
      const [rating, comment] = comments[(k + event.id) % comments.length];
      await prisma.review.create({ data: { userId: a.userId, eventId: event.id, rating, comment } });
    }
  }

  console.log(`Selesai: ${created.length} acara, ${buyers.length} customer, ${orgUsers.length} organizer.`);
  console.log("Login demo: budi@gelar.id / soundwave@gelar.id, password: password123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
