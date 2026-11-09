const request = require("supertest");
const app = require("../src/app");
const mail = require("../src/services/mail.service");
const transactionService = require("../src/services/transaction.service");
const { prisma, resetDb, createUser, createEvent } = require("./helpers");
const { addDays, addHours, addMonths } = require("../src/utils/date");

jest.mock("../src/services/mail.service");

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a5d30000000049454e44ae426082", "hex");

let org, buyer, event, ticket;

beforeEach(async () => {
  await resetDb();
  jest.clearAllMocks();
  org = await createUser("ORGANIZER");
  buyer = await createUser("CUSTOMER");
  event = await createEvent(org.user.id, { tickets: [{ name: "Reguler", price: 150000, quota: 5 }] });
  ticket = event.ticketTypes[0];
});
afterAll(() => prisma.$disconnect());

const checkout = (auth, body) => request(app).post("/api/transactions").set(auth).send({ eventId: event.id, ...body });

async function giveRewards(userId) {
  const voucher = await prisma.voucher.create({
    data: { eventId: event.id, code: "HEMAT20", discount: 20000, quota: 1, startDate: addDays(new Date(), -1), endDate: addDays(new Date(), 5) },
  });
  const coupon = await prisma.coupon.create({
    data: { userId, code: "REF-TEST", percent: 10, maxDiscount: 50000, expiresAt: addMonths(new Date(), 3) },
  });
  // Dua baris poin dengan tanggal kedaluwarsa berbeda, untuk menguji FIFO
  const soon = await prisma.point.create({
    data: { userId, amount: 5000, remaining: 5000, source: "test", expiresAt: addDays(new Date(), 10) },
  });
  const later = await prisma.point.create({
    data: { userId, amount: 10000, remaining: 10000, source: "test", expiresAt: addDays(new Date(), 60) },
  });
  return { voucher, coupon, soon, later };
}

describe("Checkout", () => {
  test("harga dihitung di server dan semua potongan tercatat", async () => {
    const { coupon, soon, later } = await giveRewards(buyer.user.id);

    const res = await checkout(buyer.auth, {
      items: [{ ticketTypeId: ticket.id, quantity: 2 }],
      voucherCode: "hemat20",
      couponId: coupon.id,
      usePoints: true,
    });

    // 300.000 - 20.000 voucher = 280.000; kupon 10% = 28.000; 252.000 - 15.000 poin = 237.000
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      status: "WAITING_PAYMENT",
      subtotal: 300000,
      voucherDiscount: 20000,
      couponDiscount: 28000,
      pointsUsed: 15000,
      total: 237000,
    });

    expect((await prisma.ticketType.findUnique({ where: { id: ticket.id } })).available).toBe(3);
    expect((await prisma.voucher.findFirst()).used).toBe(1);
    expect((await prisma.coupon.findUnique({ where: { id: coupon.id } })).usedAt).not.toBeNull();
    expect((await prisma.point.findUnique({ where: { id: soon.id } })).remaining).toBe(0);
    expect((await prisma.point.findUnique({ where: { id: later.id } })).remaining).toBe(0);
  });

  test("poin yang paling cepat kedaluwarsa dipakai lebih dulu", async () => {
    const { soon, later } = await giveRewards(buyer.user.id);
    await prisma.ticketType.update({ where: { id: ticket.id }, data: { price: 8000 } });

    await checkout(buyer.auth, { items: [{ ticketTypeId: ticket.id, quantity: 1 }], usePoints: true });

    expect((await prisma.point.findUnique({ where: { id: soon.id } })).remaining).toBe(0);
    expect((await prisma.point.findUnique({ where: { id: later.id } })).remaining).toBe(7000);
  });

  test("kursi tidak cukup: transaksi ditolak dan tidak ada data yang berubah", async () => {
    const { coupon } = await giveRewards(buyer.user.id);
    const res = await checkout(buyer.auth, {
      items: [{ ticketTypeId: ticket.id, quantity: 6 }],
      couponId: coupon.id,
      usePoints: true,
    });

    expect(res.status).toBe(400);
    expect(await prisma.transaction.count()).toBe(0);
    // SQL transaction di-rollback: kupon dan poin tidak terpakai
    expect((await prisma.coupon.findUnique({ where: { id: coupon.id } })).usedAt).toBeNull();
    const points = await prisma.point.aggregate({ _sum: { remaining: true } });
    expect(points._sum.remaining).toBe(15000);
  });

  test("dua pembeli berebut kursi terakhir: hanya satu yang berhasil", async () => {
    await prisma.ticketType.update({ where: { id: ticket.id }, data: { available: 1 } });
    const other = await createUser("CUSTOMER");
    const body = { items: [{ ticketTypeId: ticket.id, quantity: 1 }] };

    const results = await Promise.all([checkout(buyer.auth, body), checkout(other.auth, body)]);
    const statuses = results.map((r) => r.status).sort();

    expect(statuses).toEqual([201, 400]);
    expect((await prisma.ticketType.findUnique({ where: { id: ticket.id } })).available).toBe(0);
  });

  test("acara gratis langsung DONE", async () => {
    const free = await createEvent(org.user.id, { tickets: [{ name: "Gratis", price: 0, quota: 10 }] });
    const res = await request(app).post("/api/transactions").set(buyer.auth)
      .send({ eventId: free.id, items: [{ ticketTypeId: free.ticketTypes[0].id, quantity: 1 }] });
    expect(res.body.status).toBe("DONE");
    expect(res.body.total).toBe(0);
  });

  test("kupon milik orang lain tidak bisa dipakai", async () => {
    const other = await createUser("CUSTOMER");
    const { coupon } = await giveRewards(other.user.id);
    const res = await checkout(buyer.auth, { items: [{ ticketTypeId: ticket.id, quantity: 1 }], couponId: coupon.id });
    expect(res.status).toBe(400);
  });

  test("organizer tidak bisa membeli tiket", async () => {
    const res = await checkout(org.auth, { items: [{ ticketTypeId: ticket.id, quantity: 1 }] });
    expect(res.status).toBe(403);
  });
});

describe("Pembayaran & status", () => {
  async function buyOne(extra = {}) {
    const res = await checkout(buyer.auth, { items: [{ ticketTypeId: ticket.id, quantity: 2 }], ...extra });
    return res.body;
  }

  test("upload bukti mengubah status menjadi WAITING_CONFIRMATION dengan batas 3 hari", async () => {
    const trx = await buyOne();
    const res = await request(app).post(`/api/transactions/${trx.id}/proof`).set(buyer.auth)
      .attach("proof", PNG, { filename: "bukti.png", contentType: "image/png" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("WAITING_CONFIRMATION");
    const diff = new Date(res.body.confirmDeadline) - new Date();
    expect(Math.round(diff / (24 * 3600 * 1000))).toBe(3);
  });

  test("file selain gambar ditolak", async () => {
    const trx = await buyOne();
    const res = await request(app).post(`/api/transactions/${trx.id}/proof`).set(buyer.auth)
      .attach("proof", Buffer.from("hello"), { filename: "bukti.txt", contentType: "text/plain" });
    expect(res.status).toBe(400);
  });

  test("customer membatalkan: kursi, voucher, kupon, dan poin kembali", async () => {
    const { coupon } = await giveRewards(buyer.user.id);
    const trx = await buyOne({ voucherCode: "HEMAT20", couponId: coupon.id, usePoints: true });

    const res = await request(app).post(`/api/transactions/${trx.id}/cancel`).set(buyer.auth);
    expect(res.status).toBe(200);

    expect((await prisma.transaction.findUnique({ where: { id: trx.id } })).status).toBe("CANCELED");
    expect((await prisma.ticketType.findUnique({ where: { id: ticket.id } })).available).toBe(5);
    expect((await prisma.voucher.findFirst()).used).toBe(0);
    expect((await prisma.coupon.findUnique({ where: { id: coupon.id } })).usedAt).toBeNull();
    const points = await prisma.point.aggregate({ _sum: { remaining: true } });
    expect(points._sum.remaining).toBe(15000);
  });

  test("lewat 2 jam tanpa bukti bayar -> EXPIRED dan semuanya dikembalikan", async () => {
    const { soon } = await giveRewards(buyer.user.id);
    const trx = await buyOne({ usePoints: true });

    const result = await transactionService.expireOverdue(addHours(new Date(), 2.1));
    expect(result.expired).toBe(1);

    expect((await prisma.transaction.findUnique({ where: { id: trx.id } })).status).toBe("EXPIRED");
    expect((await prisma.ticketType.findUnique({ where: { id: ticket.id } })).available).toBe(5);
    expect((await prisma.point.findUnique({ where: { id: soon.id } })).remaining).toBe(5000);
  });

  test("belum lewat 2 jam -> status tetap", async () => {
    await buyOne();
    const result = await transactionService.expireOverdue(addHours(new Date(), 1.5));
    expect(result.expired).toBe(0);
  });

  test("lewat 3 hari tanpa konfirmasi organizer -> CANCELED", async () => {
    const trx = await buyOne();
    await request(app).post(`/api/transactions/${trx.id}/proof`).set(buyer.auth)
      .attach("proof", PNG, { filename: "bukti.png", contentType: "image/png" });

    const result = await transactionService.expireOverdue(addDays(new Date(), 3.1));
    expect(result.canceled).toBe(1);
    expect((await prisma.transaction.findUnique({ where: { id: trx.id } })).status).toBe("CANCELED");
    expect((await prisma.ticketType.findUnique({ where: { id: ticket.id } })).available).toBe(5);
  });

  test("rollback tidak bisa terjadi dua kali", async () => {
    const trx = await buyOne();
    await transactionService.releaseTransaction(trx.id, ["WAITING_PAYMENT"], "CANCELED");
    const second = await transactionService.releaseTransaction(trx.id, ["WAITING_PAYMENT"], "EXPIRED");
    expect(second).toBeNull();
    expect((await prisma.ticketType.findUnique({ where: { id: ticket.id } })).available).toBe(5);
  });
});

describe("Konfirmasi organizer", () => {
  async function waitingConfirmation(extra = {}) {
    const trx = (await checkout(buyer.auth, { items: [{ ticketTypeId: ticket.id, quantity: 1 }], ...extra })).body;
    await request(app).post(`/api/transactions/${trx.id}/proof`).set(buyer.auth)
      .attach("proof", PNG, { filename: "bukti.png", contentType: "image/png" });
    return trx;
  }

  test("organizer bisa melihat bukti bayar, customer lain tidak", async () => {
    const trx = await waitingConfirmation();
    const { proofId } = await prisma.transaction.findUnique({ where: { id: trx.id } });
    const stranger = await createUser("CUSTOMER");

    expect((await request(app).get(`/api/files/${proofId}`).set(org.auth)).status).toBe(200);
    expect((await request(app).get(`/api/files/${proofId}`).set(stranger.auth)).status).toBe(403);
    expect((await request(app).get(`/api/files/${proofId}`)).status).toBe(401);
  });

  test("terima -> DONE dan email terkirim", async () => {
    const trx = await waitingConfirmation();
    const res = await request(app).post(`/api/dashboard/transactions/${trx.id}/accept`).set(org.auth);

    expect(res.status).toBe(200);
    expect((await prisma.transaction.findUnique({ where: { id: trx.id } })).status).toBe("DONE");
    expect(mail.sendTransactionResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: trx.id }),
      expect.objectContaining({ email: buyer.user.email }),
      expect.anything(),
      true
    );
  });

  test("tolak -> REJECTED, kursi dan kupon kembali, email terkirim", async () => {
    const { coupon } = await giveRewards(buyer.user.id);
    const trx = await waitingConfirmation({ couponId: coupon.id });

    const res = await request(app).post(`/api/dashboard/transactions/${trx.id}/reject`).set(org.auth);
    expect(res.status).toBe(200);

    expect((await prisma.transaction.findUnique({ where: { id: trx.id } })).status).toBe("REJECTED");
    expect((await prisma.ticketType.findUnique({ where: { id: ticket.id } })).available).toBe(5);
    expect((await prisma.coupon.findUnique({ where: { id: coupon.id } })).usedAt).toBeNull();
    expect(mail.sendTransactionResult).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(), false);
  });

  test("organizer lain tidak bisa mengonfirmasi", async () => {
    const trx = await waitingConfirmation();
    const other = await createUser("ORGANIZER");
    const res = await request(app).post(`/api/dashboard/transactions/${trx.id}/accept`).set(other.auth);
    expect(res.status).toBe(404);
  });

  test("transaksi yang belum upload bukti tidak bisa diterima", async () => {
    const trx = (await checkout(buyer.auth, { items: [{ ticketTypeId: ticket.id, quantity: 1 }] })).body;
    const res = await request(app).post(`/api/dashboard/transactions/${trx.id}/accept`).set(org.auth);
    expect(res.status).toBe(400);
  });
});
