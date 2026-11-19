const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { randomCode, hashToken } = require("../utils/code");
const { addMonths, addHours } = require("../utils/date");
const mail = require("./mail.service");

const REFERRAL_POINTS = 10000;
const COUPON_PERCENT = 10;
const COUPON_MAX = 50000;

function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
}

async function uniqueReferralCode(tx) {
  for (;;) {
    const code = randomCode(8);
    const exists = await tx.user.findUnique({ where: { referralCode: code } });
    if (!exists) return code;
  }
}

async function register({ name, email, password, role, referralCode }) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError(409, "Email sudah terdaftar");

  let referrer = null;
  if (referralCode) {
    if (role !== "CUSTOMER") throw new AppError(400, "Kode referral hanya untuk akun customer");
    referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.toUpperCase() } });
    if (!referrer || referrer.role !== "CUSTOMER") {
      throw new AppError(400, "Kode referral tidak ditemukan");
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  const now = new Date();

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        referralCode: await uniqueReferralCode(tx),
        referredById: referrer ? referrer.id : null,
      },
    });

    if (referrer) {
      await tx.coupon.create({
        data: {
          userId: created.id,
          code: `REF-${randomCode(8)}`,
          percent: COUPON_PERCENT,
          maxDiscount: COUPON_MAX,
          expiresAt: addMonths(now, 3),
        },
      });
      await tx.point.create({
        data: {
          userId: referrer.id,
          amount: REFERRAL_POINTS,
          remaining: REFERRAL_POINTS,
          source: `Referral dari ${created.name}`,
          expiresAt: addMonths(now, 3),
        },
      });
    }
    return created;
  });

  return { user: publicUser(user), token: signToken(user) };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) throw new AppError(401, "Email atau password salah");
  return { user: publicUser(user), token: signToken(user) };
}

async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User tidak ditemukan");
  return publicUser(user);
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordReset.create({
    data: { userId: user.id, tokenHash: hashToken(token), expiresAt: addHours(new Date(), 1) },
  });
  await mail.sendResetPassword(user, `${process.env.WEB_URL}/reset-password?token=${token}`);
  return token;
}

async function resetPassword({ token, password }) {
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    throw new AppError(400, "Link reset tidak valid atau sudah kedaluwarsa");
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);
}

module.exports = { register, login, me, forgotPassword, resetPassword, publicUser, REFERRAL_POINTS };
