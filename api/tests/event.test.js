const request = require("supertest");
const app = require("../src/app");
const { prisma, resetDb, createUser, createEvent } = require("./helpers");
const { addDays } = require("../src/utils/date");

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("Jelajah acara", () => {
  test("hanya acara mendatang yang tampil", async () => {
    const { user: org } = await createUser("ORGANIZER");
    await createEvent(org.id, { title: "Acara Besok" });
    await createEvent(org.id, { title: "Acara Lalu", startDate: addDays(new Date(), -5) });

    const res = await request(app).get("/api/events");
    expect(res.body.data.map((e) => e.title)).toEqual(["Acara Besok"]);
  });

  test("pencarian tidak peka huruf besar/kecil dan filter kota", async () => {
    const { user: org } = await createUser("ORGANIZER");
    await createEvent(org.id, { title: "Jazz Malam Minggu", city: "Yogyakarta" });
    await createEvent(org.id, { title: "Rock Night", city: "Surabaya" });

    const search = await request(app).get("/api/events?search=jazz");
    expect(search.body.data).toHaveLength(1);

    const city = await request(app).get("/api/events?city=Surabaya");
    expect(city.body.data[0].title).toBe("Rock Night");
  });

  test("hasil kosong tetap 200 dengan data kosong", async () => {
    const res = await request(app).get("/api/events?search=tidakada");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ data: [], total: 0 });
  });

  test("detail acara menampilkan harga termurah dan voucher yang berlaku", async () => {
    const { user: org } = await createUser("ORGANIZER");
    const event = await createEvent(org.id, {
      tickets: [
        { name: "VIP", price: 300000, quota: 5 },
        { name: "Reguler", price: 100000, quota: 5 },
      ],
    });
    await prisma.voucher.create({
      data: { eventId: event.id, code: "HEMAT", discount: 20000, quota: 5, startDate: addDays(new Date(), -1), endDate: addDays(new Date(), 5) },
    });

    const res = await request(app).get(`/api/events/${event.slug}`);
    expect(res.body.minPrice).toBe(100000);
    expect(res.body.promos).toEqual([expect.objectContaining({ code: "HEMAT", discount: 20000 })]);
  });
});

describe("Kelola acara (organizer)", () => {
  const body = (categoryId) => ({
    title: "Workshop Public Speaking",
    categoryId,
    description: "Belajar berbicara di depan umum dengan percaya diri.",
    city: "Bandung",
    venue: "Ruang Kolaborasi",
    startDate: addDays(new Date(), 7).toISOString(),
    endDate: addDays(new Date(), 7.2).toISOString(),
    ticketTypes: [
      { name: "Reguler", price: 125000, quota: 40 },
      { name: "Gratis", price: 0, quota: 10 },
    ],
  });

  test("organizer membuat acara beserta jenis tiket", async () => {
    const { auth } = await createUser("ORGANIZER");
    const category = await prisma.category.create({ data: { name: "Workshop", slug: "workshop" } });

    const res = await request(app).post("/api/events").set(auth).send(body(category.id));
    expect(res.status).toBe(201);
    expect(res.body.ticketTypes).toHaveLength(2);
    expect(res.body.ticketTypes[0].available).toBe(40);
  });

  test("customer tidak boleh membuat acara", async () => {
    const { auth } = await createUser("CUSTOMER");
    const res = await request(app).post("/api/events").set(auth).send(body(1));
    expect(res.status).toBe(403);
  });

  test("tanggal selesai sebelum tanggal mulai ditolak", async () => {
    const { auth } = await createUser("ORGANIZER");
    const category = await prisma.category.create({ data: { name: "Workshop", slug: "workshop" } });
    const data = { ...body(category.id), endDate: addDays(new Date(), 1).toISOString() };
    const res = await request(app).post("/api/events").set(auth).send(data);
    expect(res.status).toBe(400);
  });

  test("organizer lain tidak bisa mengedit atau menghapus acara", async () => {
    const { user: owner } = await createUser("ORGANIZER");
    const { auth: other } = await createUser("ORGANIZER");
    const event = await createEvent(owner.id);
    const res = await request(app).delete(`/api/events/${event.id}`).set(other);
    expect(res.status).toBe(403);
  });

  test("acara yang sudah punya transaksi tidak bisa dihapus", async () => {
    const { user: org, auth } = await createUser("ORGANIZER");
    const { user: buyer } = await createUser("CUSTOMER");
    const event = await createEvent(org.id);
    await prisma.transaction.create({
      data: {
        invoice: "INV-1", userId: buyer.id, eventId: event.id, status: "DONE",
        subtotal: 0, total: 0, paymentDeadline: new Date(),
      },
    });
    const res = await request(app).delete(`/api/events/${event.id}`).set(auth);
    expect(res.status).toBe(400);
  });
});

describe("Voucher", () => {
  test("organizer membuat voucher dan customer bisa mengeceknya", async () => {
    const { user: org, auth } = await createUser("ORGANIZER");
    const { auth: customer } = await createUser("CUSTOMER");
    const event = await createEvent(org.id);

    const created = await request(app).post(`/api/events/${event.id}/vouchers`).set(auth).send({
      code: "hemat50", discount: 50000, quota: 10,
      startDate: addDays(new Date(), -1).toISOString(), endDate: addDays(new Date(), 5).toISOString(),
    });
    expect(created.status).toBe(201);
    expect(created.body.code).toBe("HEMAT50");

    const check = await request(app).get(`/api/vouchers/check?eventId=${event.id}&code=HEMAT50`).set(customer);
    expect(check.body).toEqual({ code: "HEMAT50", discount: 50000 });
  });

  test("voucher acara lain atau yang sudah berakhir ditolak", async () => {
    const { user: org } = await createUser("ORGANIZER");
    const { auth: customer } = await createUser("CUSTOMER");
    const a = await createEvent(org.id);
    const b = await createEvent(org.id);
    await prisma.voucher.create({
      data: { eventId: a.id, code: "LAMA", discount: 10000, quota: 5, startDate: addDays(new Date(), -5), endDate: addDays(new Date(), -1) },
    });

    const expired = await request(app).get(`/api/vouchers/check?eventId=${a.id}&code=LAMA`).set(customer);
    expect(expired.body.message).toBe("Voucher sudah berakhir");

    const other = await request(app).get(`/api/vouchers/check?eventId=${b.id}&code=LAMA`).set(customer);
    expect(other.status).toBe(400);
  });
});
