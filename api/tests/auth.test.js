const request = require("supertest");
const app = require("../src/app");
const authService = require("../src/services/auth.service");
const { prisma, resetDb, createUser } = require("./helpers");

jest.mock("../src/services/mail.service");

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const register = (body) =>
  request(app).post("/api/auth/register").send({ password: "password123", role: "CUSTOMER", ...body });

describe("Registrasi & referral", () => {
  test("user baru mendapat kode referral unik 8 karakter", async () => {
    const res = await register({ name: "Budi", email: "budi@test.id" });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.referralCode).toMatch(/^[A-Z0-9]{8}$/);
    expect(res.body.user.password).toBeUndefined();
  });

  test("daftar dengan referral: user baru dapat kupon, pemilik kode dapat 10.000 poin berlaku 3 bulan", async () => {
    const { user: referrer } = await createUser("CUSTOMER", { referralCode: "BUDI2026" });

    const res = await register({ name: "Siti", email: "siti@test.id", referralCode: "budi2026" });
    expect(res.status).toBe(201);

    const coupon = await prisma.coupon.findFirst({ where: { userId: res.body.user.id } });
    expect(coupon).toMatchObject({ percent: 10, maxDiscount: 50000, usedAt: null });

    const point = await prisma.point.findFirst({ where: { userId: referrer.id } });
    expect(point.amount).toBe(10000);
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 3);
    expect(Math.abs(point.expiresAt - expected)).toBeLessThan(60 * 1000);
  });

  test("tiga orang memakai kode yang sama: saldo pemilik 30.000", async () => {
    const { user: referrer } = await createUser("CUSTOMER", { referralCode: "BUDI2026" });
    for (const name of ["A", "B", "C"]) {
      await register({ name: `User ${name}`, email: `${name}@test.id`, referralCode: "BUDI2026" });
    }
    const sum = await prisma.point.aggregate({ where: { userId: referrer.id }, _sum: { remaining: true } });
    expect(sum._sum.remaining).toBe(30000);
  });

  test("kode referral tidak valid ditolak dan tidak ada user yang dibuat", async () => {
    const res = await register({ name: "Siti", email: "siti@test.id", referralCode: "SALAH123" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Kode referral tidak ditemukan");
    expect(await prisma.user.count()).toBe(0);
  });

  test("email yang sudah terdaftar ditolak", async () => {
    await createUser("CUSTOMER", { email: "budi@test.id" });
    const res = await register({ name: "Budi", email: "budi@test.id" });
    expect(res.status).toBe(409);
  });

  test("password kurang dari 8 karakter ditolak", async () => {
    const res = await register({ name: "Budi", email: "budi@test.id", password: "123" });
    expect(res.status).toBe(400);
  });
});

describe("Login & proteksi route", () => {
  test("login berhasil dan /me mengembalikan user", async () => {
    await createUser("ORGANIZER", { email: "org@test.id" });
    const login = await request(app).post("/api/auth/login").send({ email: "org@test.id", password: "password123" });
    expect(login.status).toBe(200);

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(me.body.role).toBe("ORGANIZER");
  });

  test("password salah ditolak", async () => {
    await createUser("CUSTOMER", { email: "budi@test.id" });
    const res = await request(app).post("/api/auth/login").send({ email: "budi@test.id", password: "salahsalah" });
    expect(res.status).toBe(401);
  });

  test("tanpa token -> 401, peran salah -> 403", async () => {
    const { auth } = await createUser("CUSTOMER");
    expect((await request(app).get("/api/dashboard/summary")).status).toBe(401);
    expect((await request(app).get("/api/dashboard/summary").set(auth)).status).toBe(403);
  });
});

describe("Lupa & reset password", () => {
  test("token reset bisa dipakai sekali untuk mengganti password", async () => {
    await createUser("CUSTOMER", { email: "budi@test.id" });
    const token = await authService.forgotPassword("budi@test.id");

    const reset = await request(app).post("/api/auth/reset-password").send({ token, password: "passwordbaru" });
    expect(reset.status).toBe(200);

    const login = await request(app).post("/api/auth/login").send({ email: "budi@test.id", password: "passwordbaru" });
    expect(login.status).toBe(200);

    const again = await request(app).post("/api/auth/reset-password").send({ token, password: "lainlagi1" });
    expect(again.status).toBe(400);
  });

  test("email tidak terdaftar tetap mendapat jawaban yang sama", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "tidakada@test.id" });
    expect(res.status).toBe(200);
  });
});
