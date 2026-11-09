const request = require("supertest");
const app = require("../src/app");
const { prisma, resetDb, createUser, createEvent } = require("./helpers");
const { addDays } = require("../src/utils/date");

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

async function doneTransaction(userId, event, quantity, total, createdAt = new Date()) {
  return prisma.transaction.create({
    data: {
      invoice: `INV-${Math.random().toString(36).slice(2, 10)}`,
      userId,
      eventId: event.id,
      status: "DONE",
      subtotal: total,
      total,
      paymentDeadline: createdAt,
      createdAt,
      items: { create: [{ ticketTypeId: event.ticketTypes[0].id, quantity, unitPrice: total / quantity }] },
    },
  });
}

describe("Ulasan", () => {
  test("peserta bisa mengulas setelah acara selesai, hanya sekali", async () => {
    const org = await createUser("ORGANIZER");
    const buyer = await createUser("CUSTOMER");
    const past = await createEvent(org.user.id, { startDate: addDays(new Date(), -3), endDate: addDays(new Date(), -2) });
    await doneTransaction(buyer.user.id, past, 1, 100000);

    const body = { rating: 5, comment: "Acaranya seru sekali!" };
    const first = await request(app).post(`/api/events/${past.id}/reviews`).set(buyer.auth).send(body);
    expect(first.status).toBe(201);

    const second = await request(app).post(`/api/events/${past.id}/reviews`).set(buyer.auth).send(body);
    expect(second.status).toBe(409);
  });

  test("belum selesai acaranya atau bukan peserta -> ditolak", async () => {
    const org = await createUser("ORGANIZER");
    const buyer = await createUser("CUSTOMER");
    const stranger = await createUser("CUSTOMER");
    const upcoming = await createEvent(org.user.id);
    const past = await createEvent(org.user.id, { startDate: addDays(new Date(), -3), endDate: addDays(new Date(), -2) });
    await doneTransaction(buyer.user.id, upcoming, 1, 100000);

    const body = { rating: 4, comment: "Belum mulai acaranya" };
    expect((await request(app).post(`/api/events/${upcoming.id}/reviews`).set(buyer.auth).send(body)).status).toBe(400);
    expect((await request(app).post(`/api/events/${past.id}/reviews`).set(stranger.auth).send(body)).status).toBe(403);
  });

  test("profil organizer menampilkan rata-rata rating", async () => {
    const org = await createUser("ORGANIZER", { name: "Soundwave" });
    const past = await createEvent(org.user.id, { startDate: addDays(new Date(), -3), endDate: addDays(new Date(), -2) });
    for (const rating of [5, 4]) {
      const buyer = await createUser("CUSTOMER");
      await prisma.review.create({ data: { userId: buyer.user.id, eventId: past.id, rating, comment: "ok" } });
    }

    const res = await request(app).get(`/api/organizers/${org.user.id}`);
    expect(res.body).toMatchObject({ name: "Soundwave", rating: 4.5, reviewCount: 2 });
  });
});

describe("Highlight beranda", () => {
  test("statistik dan testimoni diambil dari data", async () => {
    const org = await createUser("ORGANIZER");
    const buyer = await createUser("CUSTOMER");
    const past = await createEvent(org.user.id, { startDate: addDays(new Date(), -3), endDate: addDays(new Date(), -2) });
    await createEvent(org.user.id, { city: "Bandung" });
    await doneTransaction(buyer.user.id, past, 3, 300000);
    await prisma.review.create({ data: { userId: buyer.user.id, eventId: past.id, rating: 5, comment: "Mantap sekali" } });

    const res = await request(app).get("/api/highlights");
    expect(res.body.stats).toEqual({ events: 1, ticketsSold: 3, cities: 2, organizers: 1 });
    expect(res.body.reviews[0]).toMatchObject({ rating: 5, comment: "Mantap sekali" });
  });
});

describe("Dashboard organizer", () => {
  test("statistik per bulan hanya menghitung transaksi DONE milik organizer", async () => {
    const org = await createUser("ORGANIZER");
    const otherOrg = await createUser("ORGANIZER");
    const buyer = await createUser("CUSTOMER");
    const event = await createEvent(org.user.id);
    const otherEvent = await createEvent(otherOrg.user.id);

    await doneTransaction(buyer.user.id, event, 2, 200000, new Date(2026, 2, 10));
    await doneTransaction(buyer.user.id, event, 1, 100000, new Date(2026, 2, 20));
    await doneTransaction(buyer.user.id, otherEvent, 5, 500000, new Date(2026, 2, 15));

    const res = await request(app).get("/api/dashboard/stats?period=month&year=2026").set(org.auth);
    const march = res.body.find((r) => r.label === "Mar");
    expect(march).toEqual({ label: "Mar", revenue: 300000, tickets: 3 });
    expect(res.body).toHaveLength(12);
  });

  test("statistik per hari dan per tahun", async () => {
    const org = await createUser("ORGANIZER");
    const buyer = await createUser("CUSTOMER");
    const event = await createEvent(org.user.id);
    await doneTransaction(buyer.user.id, event, 1, 100000, new Date(2026, 1, 14));

    const day = await request(app).get("/api/dashboard/stats?period=day&year=2026&month=2").set(org.auth);
    expect(day.body).toHaveLength(28);
    expect(day.body[13]).toEqual({ label: "14", revenue: 100000, tickets: 1 });

    const year = await request(app).get("/api/dashboard/stats?period=year&year=2026").set(org.auth);
    expect(year.body).toEqual([{ label: "2026", revenue: 100000, tickets: 1 }]);
  });

  test("daftar peserta dijumlahkan per orang", async () => {
    const org = await createUser("ORGANIZER");
    const budi = await createUser("CUSTOMER", { name: "Budi" });
    const siti = await createUser("CUSTOMER", { name: "Siti" });
    const event = await createEvent(org.user.id);
    await doneTransaction(budi.user.id, event, 2, 200000);
    await doneTransaction(budi.user.id, event, 1, 100000);
    await doneTransaction(siti.user.id, event, 1, 100000);

    const res = await request(app).get(`/api/dashboard/events/${event.id}/attendees`).set(org.auth);
    expect(res.body.totalAttendees).toBe(2);
    expect(res.body.totalTickets).toBe(4);
    expect(res.body.attendees.find((a) => a.name === "Budi")).toMatchObject({ quantity: 3, totalPaid: 300000 });
  });
});
