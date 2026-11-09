// Data contoh untuk development dan demo. Jalankan: npm run db:seed
// Semua akun demo memakai password: password123
process.env.TZ = process.env.TZ || "Asia/Jakarta";
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { addDays, addHours, addMonths } = require("../src/utils/date");

const prisma = new PrismaClient();
const now = new Date();
const IMAGES = path.join(__dirname, "seed-images");

// Angka acak yang selalu sama setiap seed dijalankan, supaya data demo stabil
let state = 20261109;
function random() {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
}
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (min, max) => min + Math.floor(random() * (max - min + 1));

function at(days, hour) {
  const d = addDays(now, days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function saveImage(file, ownerId = null, isPrivate = false) {
  const data = fs.readFileSync(path.join(IMAGES, file));
  const mimeType = file.endsWith(".png") ? "image/png" : "image/jpeg";
  return prisma.file.create({ data: { mimeType, data, ownerId, isPrivate } });
}

// ---------------------------------------------------------------- data master

const categories = [
  { name: "Musik", slug: "musik" },
  { name: "Seminar", slug: "seminar" },
  { name: "Workshop", slug: "workshop" },
  { name: "Olahraga", slug: "olahraga" },
  { name: "Kuliner", slug: "kuliner" },
  { name: "Teknologi", slug: "teknologi" },
];

const organizers = [
  { key: "soundwave", name: "Soundwave Production", email: "soundwave@gelar.id", code: "SOUNDWV1", bio: "Promotor konser dan festival musik independen sejak 2015. Sudah menggelar lebih dari 120 pertunjukan di 8 kota." },
  { key: "ruang", name: "Ruang Belajar Nusantara", email: "ruangbelajar@gelar.id", code: "RUANGBLJ", bio: "Komunitas belajar yang rutin mengadakan seminar karier dan workshop keterampilan untuk anak muda." },
  { key: "lari", name: "Lari Bareng Indonesia", email: "laribareng@gelar.id", code: "LARIBRNG", bio: "Penyelenggara fun run, gowes, dan acara olahraga komunitas. Sehat itu lebih seru kalau bareng-bareng." },
  { key: "rasa", name: "Rasa Nusantara Events", email: "rasanusantara@gelar.id", code: "RASANUSA", bio: "Kurator festival kuliner dan bazar UMKM. Mengumpulkan rasa dari Sabang sampai Merauke di satu tempat." },
  { key: "kode", name: "Komunitas Kode Kita", email: "kodekita@gelar.id", code: "KODEKITA", bio: "Komunitas developer yang membuat kelas coding gratis dan hackathon untuk pemula." },
];

// [nama, email, kode referral, direferensikan oleh, foto]
const customers = [
  ["Budi Santoso", "budi@gelar.id", "BUDI2026", null, "budi"],
  ["Siti Rahma", "siti@gelar.id", "SITI2026", "BUDI2026", "siti"],
  ["Andi Pratama", "andi@gelar.id", "ANDI2026", "BUDI2026", "andi"],
  ["Dewi Lestari", "dewi@gelar.id", "DEWI2026", "BUDI2026", "dewi"],
  ["Rizky Maulana", "rizky@gelar.id", "RIZKY026", null, null],
  ["Putri Ayu", "putri@gelar.id", "PUTRI026", "RIZKY026", "putri"],
  ["Fajar Nugroho", "fajar@gelar.id", "FAJAR026", "RIZKY026", null],
  ["Nadia Safitri", "nadia@gelar.id", "NADIA026", null, "nadia"],
  ["Bayu Saputra", "bayu@gelar.id", "BAYU2026", null, null],
  ["Intan Permata", "intan@gelar.id", "INTAN026", "NADIA026", null],
  ["Yoga Prasetyo", "yoga@gelar.id", "YOGA2026", null, null],
  ["Citra Kirana", "citra@gelar.id", "CITRA026", null, null],
  ["Dimas Aditya", "dimas@gelar.id", "DIMAS026", "SITI2026", null],
  ["Rani Wulandari", "rani@gelar.id", "RANI2026", null, null],
  ["Hendra Gunawan", "hendra@gelar.id", "HENDRA26", null, null],
];

const descriptions = {
  musik: "Nikmati penampilan musisi lokal terbaik dalam suasana yang hangat dan tata suara yang mantap.\n\nPintu dibuka 1 jam sebelum acara. Tunjukkan e-tiket dan kartu identitas saat penukaran gelang. Dilarang membawa makanan, minuman, dan kamera profesional.",
  seminar: "Seminar interaktif bersama praktisi yang berpengalaman di bidangnya. Ada sesi tanya jawab dan networking setelah materi.\n\nPeserta mendapat materi presentasi, e-sertifikat, dan snack. Cocok untuk mahasiswa dan fresh graduate.",
  workshop: "Kelas praktik dengan jumlah peserta terbatas supaya setiap orang mendapat perhatian dari mentor.\n\nSemua alat dan bahan disediakan panitia. Peserta cukup membawa semangat belajar dan ponsel atau laptop sesuai kebutuhan materi.",
  olahraga: "Acara olahraga komunitas untuk semua level, dari pemula sampai yang sudah rutin berlatih.\n\nTermasuk race pack (kaos, nomor dada), air mineral di setiap pos, tim medis, dan medali finisher. Pengambilan race pack H-1 di lokasi.",
  kuliner: "Puluhan tenant kuliner dari berbagai daerah di Indonesia berkumpul di satu tempat, ditemani live music dan area bermain anak.\n\nTiket masuk sudah termasuk satu voucher minuman. Pembayaran di tenant bisa tunai atau QRIS.",
  teknologi: "Sesi belajar langsung praktik dari dasar sampai membuat proyek kecil. Mentor adalah developer yang sehari-hari bekerja di industri.\n\nBawa laptop sendiri dengan browser terbaru. Materi dan rekaman dibagikan setelah acara.",
};

// [foto, organizer, kategori, judul, kota, tempat, hari dari sekarang, jam mulai, durasi jam, tiket [nama, harga, kuota]]
const upcoming = [
  ["indie-fest", "soundwave", "musik", "Jakarta Indie Music Fest 2026", "Jakarta", "Istora Senayan", 33, 15, 8, [["Presale", 150000, 200], ["Reguler", 200000, 300], ["VIP", 450000, 50]]],
  ["akustik-braga", "soundwave", "musik", "Akustik Senja di Braga", "Bandung", "Braga Citywalk", 12, 17, 3, [["Reguler", 85000, 120]]],
  ["jazz-malam", "soundwave", "musik", "Jazz Malam Minggu", "Yogyakarta", "Taman Budaya Yogyakarta", 20, 19, 4, [["Reguler", 120000, 150], ["VIP", 250000, 30]]],
  ["rock-night", "soundwave", "musik", "Surabaya Rock Night", "Surabaya", "Grand City Convention Hall", 45, 19, 5, [["Festival", 175000, 400]]],
  ["orkestra", "soundwave", "musik", "Simfoni Nusantara: Konser Orkestra", "Jakarta", "Aula Simfonia Jakarta", 27, 19, 3, [["Balkon", 300000, 150], ["Platinum", 750000, 60]]],
  ["musik-pantai-2026", "soundwave", "musik", "Sunset Beach Music Festival", "Bali", "Pantai Double Six, Seminyak", 52, 15, 9, [["Early Bird", 275000, 300], ["Reguler", 350000, 500]]],
  ["seminar-karier", "ruang", "seminar", "Seminar Karier: Masuk Dunia Tech Tanpa Gelar IT", "Jakarta", "Gedung Cyber 2", 6, 9, 3, [["Mahasiswa", 50000, 100], ["Umum", 75000, 150]]],
  ["public-speaking", "ruang", "workshop", "Workshop Public Speaking untuk Introvert", "Bandung", "Co-working Ruang Kolaborasi", 14, 13, 4, [["Reguler", 125000, 40]]],
  ["literasi-keuangan", "ruang", "seminar", "Literasi Keuangan untuk Gen Z", "Surabaya", "Universitas Airlangga, Aula Garuda Mukti", 25, 9, 3, [["Gratis", 0, 300]]],
  ["fotografi-ponsel", "ruang", "workshop", "Kelas Fotografi Ponsel", "Bali", "Ubud Creative Space", 28, 9, 4, [["Reguler", 150000, 25]]],
  ["desain-canva", "ruang", "workshop", "Workshop Desain Grafis dengan Canva", "Semarang", "Kampus Udinus Gedung H", 17, 13, 3, [["Reguler", 65000, 60]]],
  ["pottery", "ruang", "workshop", "Kelas Pottery untuk Pemula", "Yogyakarta", "Studio Tanah Liat Kasongan", 9, 10, 3, [["Reguler", 225000, 16]]],
  ["fun-run", "lari", "olahraga", "Jakarta Fun Run 5K", "Jakarta", "Gelora Bung Karno", 16, 6, 4, [["5K", 175000, 500], ["5K + Jersey", 275000, 200]]],
  ["sunrise-ride", "lari", "olahraga", "Bandung Sunrise Ride", "Bandung", "Gedung Sate", 22, 5, 4, [["Peserta", 100000, 150]]],
  ["yoga-sanur", "lari", "olahraga", "Yoga Pagi di Pantai Sanur", "Bali", "Pantai Sanur", 8, 6, 2, [["Peserta", 60000, 60]]],
  ["medan-marathon", "lari", "olahraga", "Medan City Marathon", "Medan", "Lapangan Benteng", 60, 5, 6, [["10K", 225000, 300], ["Half Marathon", 325000, 200]]],
  ["night-ride", "lari", "olahraga", "Jakarta Night Ride", "Jakarta", "Bundaran HI", 11, 20, 3, [["Peserta", 90000, 250]]],
  ["trail-run", "lari", "olahraga", "Trail Run Lembang 10K", "Bandung", "Orchid Forest Cikole", 38, 6, 5, [["10K", 250000, 200]]],
  ["kuliner-medan", "rasa", "kuliner", "Festival Kuliner Nusantara", "Medan", "Lapangan Merdeka Medan", 10, 10, 10, [["Tiket Masuk", 25000, 1000]]],
  ["bazar-kopi", "rasa", "kuliner", "Bazar Kopi & Kue Lokal", "Yogyakarta", "Jogja Expo Center", 19, 10, 9, [["Tiket Masuk", 20000, 800]]],
  ["street-food", "rasa", "kuliner", "Pasar Malam Street Food", "Surabaya", "Taman Bungkul", 24, 17, 6, [["Tiket Masuk", 15000, 1200]]],
  ["react-dasar", "kode", "teknologi", "Belajar React dari Nol", "Yogyakarta", "Jogja Digital Valley", 18, 9, 6, [["Peserta", 0, 80]]],
  ["data-analyst", "kode", "teknologi", "Bootcamp Data Analyst Sehari", "Bandung", "Bandung Digital Valley", 31, 9, 8, [["Reguler", 199000, 50]]],
  ["hackathon", "kode", "teknologi", "Hackathon Gelar 48 Jam", "Jakarta", "Block71 Jakarta", 41, 9, 48, [["Per Orang", 50000, 120]]],
];

// Acara yang sudah lewat: untuk statistik, ulasan, dan riwayat pembelian
const past = [
  ["konser-amal", "soundwave", "musik", "Konser Amal Akhir Tahun 2025", "Jakarta", "Balai Sarbini", -320, 19, 4, [["Reguler", 150000, 300]]],
  ["desain-ui", "kode", "teknologi", "Workshop Desain UI untuk Pemula", "Bandung", "Ruang Kolaborasi", -250, 9, 5, [["Reguler", 100000, 50]]],
  ["startup-101", "ruang", "seminar", "Seminar Startup 101", "Jakarta", "Gedung Kolaborasi Senayan", -190, 9, 4, [["Umum", 80000, 200]]],
  ["durian-medan", "rasa", "kuliner", "Festival Durian & Kuliner Medan", "Medan", "Lapangan Merdeka Medan", -130, 10, 10, [["Tiket Masuk", 30000, 800]]],
  ["fun-bike", "lari", "olahraga", "Fun Bike Semarang", "Semarang", "Simpang Lima", -95, 6, 4, [["Peserta", 120000, 400]]],
  ["night-run", "lari", "olahraga", "Night Run Surabaya", "Surabaya", "Taman Bungkul", -60, 19, 3, [["5K", 150000, 300]]],
  ["pesta-pantai", "soundwave", "musik", "Pesta Musik Pantai", "Bali", "Pantai Kuta", -35, 15, 6, [["Reguler", 200000, 200]]],
  ["akustik-vol1", "soundwave", "musik", "Akustik Malam Minggu Vol. 1", "Yogyakarta", "Kopi Klotok Pakem", -12, 19, 3, [["Reguler", 75000, 80]]],
];

const reviewTexts = {
  5: [
    "Acaranya seru banget! Sound system mantap dan antrean masuk rapi. Pasti datang lagi tahun depan.",
    "Panitianya ramah dan sigap. Semua sesuai jadwal, tidak ada yang molor.",
    "Worth it banget untuk harganya. Pengalaman yang susah dilupakan.",
    "Materi jelas, mentornya sabar menjawab semua pertanyaan. Recommended!",
    "Suasananya hangat, tempatnya bersih, dan informasinya lengkap dari awal.",
  ],
  4: [
    "Secara keseluruhan bagus, cuma parkirnya agak susah. Datang lebih awal ya.",
    "Seru dan terorganisir. Semoga next time ada lebih banyak tempat duduk.",
    "Acaranya menyenangkan, tapi antrean penukaran tiket cukup panjang.",
    "Bagus, harga sebanding dengan kualitas. Toiletnya saja yang kurang.",
  ],
  3: [
    "Lumayan, tapi acaranya mulai telat 30 menit dan informasinya kurang jelas.",
    "Tempatnya terlalu penuh, jadi kurang nyaman. Kontennya sih oke.",
  ],
};

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

  console.log("Membuat akun...");
  const org = {};
  for (const [i, o] of organizers.entries()) {
    org[o.key] = await prisma.user.create({
      data: { name: o.name, email: o.email, password, role: "ORGANIZER", referralCode: o.code, bio: o.bio, createdAt: addDays(now, -500 + i * 30) },
    });
  }

  const cust = {};
  for (const [i, [name, email, code, ref, photo]] of customers.entries()) {
    const referrer = ref ? cust[ref] : null;
    const joined = addDays(now, -400 + i * 25);
    let user = await prisma.user.create({
      data: { name, email, password, role: "CUSTOMER", referralCode: code, referredById: referrer?.id ?? null, createdAt: joined },
    });
    if (photo) {
      const file = await saveImage(`avatars/${photo}.jpg`, user.id);
      user = await prisma.user.update({ where: { id: user.id }, data: { avatarId: file.id } });
    }
    cust[code] = user;
    if (referrer) {
      // Sama seperti alur registrasi. Referral lama dibuat "baru" supaya kupon & poin masih berlaku untuk demo.
      const credited = addDays(now, -(40 - i * 2));
      await prisma.coupon.create({
        data: { userId: user.id, code: `REF-${code}`, percent: 10, maxDiscount: 50000, expiresAt: addMonths(credited, 3), createdAt: credited },
      });
      await prisma.point.create({
        data: { userId: referrer.id, amount: 10000, remaining: 10000, source: `Referral dari ${name}`, expiresAt: addMonths(credited, 3), createdAt: credited },
      });
    }
  }
  // Contoh poin yang sudah hangus dan kupon yang sudah kedaluwarsa
  await prisma.point.create({
    data: { userId: cust.BUDI2026.id, amount: 10000, remaining: 10000, source: "Referral dari Rina", expiresAt: addDays(now, -10), createdAt: addMonths(addDays(now, -10), -3) },
  });
  await prisma.coupon.create({
    data: { userId: cust.DIMAS026.id, code: "REF-OLD-DIMAS", percent: 10, maxDiscount: 50000, expiresAt: addDays(now, -5), createdAt: addMonths(addDays(now, -5), -3) },
  });

  console.log("Membuat acara...");
  const events = {};
  for (const [key, o, cat, title, city, venue, days, hour, hours, tickets] of [...upcoming, ...past]) {
    const image = await saveImage(`events/${key}.jpg`, org[o].id);
    const startDate = at(days, hour);
    events[key] = await prisma.event.create({
      data: {
        organizerId: org[o].id,
        categoryId: categoryId[cat],
        title,
        slug: key,
        description: descriptions[cat],
        city,
        venue,
        imageId: image.id,
        startDate,
        endDate: addHours(startDate, hours),
        createdAt: addDays(startDate, -75),
        ticketTypes: { create: tickets.map(([name, price, quota]) => ({ name, price, quota, available: quota })) },
      },
      include: { ticketTypes: true },
    });
  }

  const vouchers = {};
  for (const [key, code, discount, quota, from, to] of [
    ["indie-fest", "INDIEFEST", 25000, 100, -3, 25],
    ["seminar-karier", "KARIER20", 20000, 50, -2, 5],
    ["fun-run", "LARIHEMAT", 30000, 80, -2, 12],
    ["rock-night", "ROCKEARLY", 25000, 50, 5, 30],
    ["orkestra", "SIMFONI50", 50000, 40, -5, 20],
    ["data-analyst", "DATA25", 25000, 30, -1, 28],
    ["konser-amal", "AMAL2025", 20000, 50, -360, -322],
  ]) {
    vouchers[key] = await prisma.voucher.create({
      data: { eventId: events[key].id, code, discount, quota, startDate: addDays(now, from), endDate: addDays(now, to) },
    });
  }

  console.log("Membuat riwayat transaksi...");
  const proof = fs.readFileSync(path.join(IMAGES, "proof.png"));
  let invoiceNo = 1;

  // Satu pembelian. Kursi, voucher, kupon, dan poin diperbarui supaya data konsisten dengan aturan bisnis.
  async function buy(event, buyer, status, createdAt, opts = {}) {
    const ticket = opts.ticket || event.ticketTypes[between(0, event.ticketTypes.length - 1)];
    const quantity = opts.quantity || between(1, 3);
    const subtotal = ticket.price * quantity;
    const voucher = opts.voucher || null;
    const voucherDiscount = voucher ? Math.min(voucher.discount, subtotal) : 0;
    const coupon = opts.coupon || null;
    const couponDiscount = coupon ? Math.min(Math.floor(((subtotal - voucherDiscount) * coupon.percent) / 100), coupon.maxDiscount) : 0;
    const pointsUsed = Math.min(opts.points || 0, subtotal - voucherDiscount - couponDiscount);
    const total = subtotal - voucherDiscount - couponDiscount - pointsUsed;
    const holdsSeat = ["WAITING_PAYMENT", "WAITING_CONFIRMATION", "DONE"].includes(status);

    if (holdsSeat) {
      await prisma.ticketType.update({ where: { id: ticket.id }, data: { available: { decrement: quantity } } });
      if (voucher) await prisma.voucher.update({ where: { id: voucher.id }, data: { used: { increment: 1 } } });
      if (coupon) await prisma.coupon.update({ where: { id: coupon.id }, data: { usedAt: createdAt } });
    }
    let proofId = null;
    if (["WAITING_CONFIRMATION", "DONE", "REJECTED"].includes(status) && total > 0 && opts.withProof) {
      proofId = (await prisma.file.create({ data: { mimeType: "image/png", data: proof, ownerId: buyer.id, isPrivate: true } })).id;
    }
    const trx = await prisma.transaction.create({
      data: {
        invoice: `INV-${createdAt.toISOString().slice(0, 10).replace(/-/g, "")}-${String(invoiceNo++).padStart(4, "0")}`,
        userId: buyer.id,
        eventId: event.id,
        status: total === 0 && holdsSeat ? "DONE" : status,
        subtotal,
        voucherId: voucher?.id ?? null,
        voucherDiscount,
        couponId: coupon?.id ?? null,
        couponDiscount,
        pointsUsed,
        total,
        proofId,
        paymentDeadline: addHours(createdAt, 2),
        confirmDeadline: status === "WAITING_CONFIRMATION" ? addDays(addHours(createdAt, 1), 3) : null,
        createdAt,
        items: { create: [{ ticketTypeId: ticket.id, quantity, unitPrice: ticket.price }] },
      },
    });
    if (pointsUsed > 0 && holdsSeat) {
      const point = await prisma.point.findFirst({ where: { userId: buyer.id, remaining: { gte: pointsUsed }, expiresAt: { gt: now } }, orderBy: { expiresAt: "asc" } });
      await prisma.point.update({ where: { id: point.id }, data: { remaining: { decrement: pointsUsed } } });
      await prisma.pointUsage.create({ data: { transactionId: trx.id, pointId: point.id, amount: pointsUsed } });
    }
    return trx;
  }

  const buyers = Object.values(cust);
  const budi = cust.BUDI2026;

  // Acara lampau: 12-24 pembeli, tersebar 2 bulan sebelum acara (mengisi grafik tahun/bulan/hari)
  for (const p of past) {
    const event = events[p[0]];
    const count = between(12, 24);
    for (let k = 0; k < count; k++) {
      const buyer = k === 0 && p[0] === "akustik-vol1" ? budi : pick(buyers);
      await buy(event, buyer, "DONE", addHours(addDays(event.startDate, -between(1, 60)), -between(0, 10)), { withProof: true });
    }
    // Beberapa yang gagal, untuk realisme
    await buy(event, pick(buyers), "EXPIRED", addDays(event.startDate, -between(5, 40)));
    await buy(event, pick(buyers), "REJECTED", addDays(event.startDate, -between(5, 40)), { withProof: true });
  }
  await buy(events["konser-amal"], cust.HENDRA26, "DONE", addDays(events["konser-amal"].startDate, -10), { voucher: vouchers["konser-amal"], withProof: true });

  // Acara mendatang: penjualan 30 hari terakhir
  for (const u of upcoming) {
    const event = events[u[0]];
    const count = between(3, 10);
    for (let k = 0; k < count; k++) {
      await buy(event, pick(buyers), "DONE", addHours(addDays(now, -between(1, 30)), -between(0, 12)), { withProof: true });
    }
  }

  // Contoh yang sengaja dibuat untuk demo setiap status dan potongan
  await buy(events["indie-fest"], budi, "DONE", addDays(now, -8), { ticket: events["indie-fest"].ticketTypes[1], quantity: 2, voucher: vouchers["indie-fest"], points: 5000, withProof: true });
  await buy(events["jazz-malam"], budi, "WAITING_PAYMENT", addHours(now, -0.4), { quantity: 2 });
  await buy(events["orkestra"], budi, "CANCELED", addDays(now, -3));
  await buy(events["indie-fest"], cust.SITI2026, "WAITING_PAYMENT", addHours(now, -1.2), { quantity: 2 });
  await buy(events["indie-fest"], cust.ANDI2026, "DONE", addDays(now, -6), { coupon: await prisma.coupon.findFirst({ where: { userId: cust.ANDI2026.id } }), withProof: true });
  await buy(events["indie-fest"], cust.ANDI2026, "WAITING_CONFIRMATION", addHours(now, -5), { withProof: true });
  await buy(events["akustik-braga"], cust.NADIA026, "WAITING_CONFIRMATION", addDays(now, -1), { withProof: true });
  await buy(events["rock-night"], cust.YOGA2026, "WAITING_CONFIRMATION", addDays(now, -2.5), { withProof: true });
  await buy(events["fun-run"], cust.DEWI2026, "WAITING_CONFIRMATION", addDays(now, -1), { voucher: vouchers["fun-run"], withProof: true });
  await buy(events["seminar-karier"], cust.CITRA026, "WAITING_CONFIRMATION", addHours(now, -20), { voucher: vouchers["seminar-karier"], withProof: true });
  await buy(events["data-analyst"], cust.BAYU2026, "WAITING_CONFIRMATION", addHours(now, -30), { withProof: true });
  await buy(events["akustik-braga"], cust.RIZKY026, "REJECTED", addDays(now, -6), { withProof: true });
  await buy(events["jazz-malam"], cust.ANDI2026, "EXPIRED", addDays(now, -4));
  await buy(events["seminar-karier"], cust.DEWI2026, "CANCELED", addDays(now, -2));
  await buy(events["react-dasar"], budi, "DONE", addDays(now, -5), { quantity: 1 });

  console.log("Membuat ulasan...");
  for (const p of past) {
    const event = events[p[0]];
    const attendees = await prisma.transaction.findMany({
      where: { eventId: event.id, status: "DONE", userId: { not: budi.id } },
      distinct: ["userId"],
      select: { userId: true },
    });
    for (const a of attendees.slice(0, between(4, 8))) {
      const roll = random();
      const rating = roll < 0.55 ? 5 : roll < 0.88 ? 4 : 3;
      await prisma.review.create({
        data: { userId: a.userId, eventId: event.id, rating, comment: pick(reviewTexts[rating]), createdAt: addDays(event.endDate, between(1, 6)) },
      });
    }
  }

  const [eventCount, trxCount, reviewCount] = await Promise.all([prisma.event.count(), prisma.transaction.count(), prisma.review.count()]);
  console.log(`Selesai: ${eventCount} acara, ${customers.length} customer, ${organizers.length} organizer, ${trxCount} transaksi, ${reviewCount} ulasan.`);
  console.log("Login demo: budi@gelar.id (customer) / soundwave@gelar.id (organizer), password: password123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
