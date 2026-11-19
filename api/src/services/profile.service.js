const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { saveFile } = require("./file.service");
const { publicUser } = require("./auth.service");

async function updateProfile(userId, { name, bio }, avatar) {
  const user = await prisma.$transaction(async (tx) => {
    const data = { name, bio };
    if (avatar) {
      const file = await saveFile(avatar, userId, false, tx);
      data.avatarId = file.id;
    }
    return tx.user.update({ where: { id: userId }, data });
  });
  return publicUser(user);
}

async function changePassword(userId, { oldPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!(await bcrypt.compare(oldPassword, user.password))) {
    throw new AppError(400, "Password lama salah");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { password: await bcrypt.hash(newPassword, 10) },
  });
}

async function pointBalance(userId, client = prisma) {
  const result = await client.point.aggregate({
    where: { userId, expiresAt: { gt: new Date() } },
    _sum: { remaining: true },
  });
  return result._sum.remaining || 0;
}

async function getRewards(userId) {
  const now = new Date();
  const [user, points, coupons, balance] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } }),
    prisma.point.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.coupon.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    pointBalance(userId),
  ]);
  return {
    referralCode: user.referralCode,
    balance,
    points: points.map((p) => ({ ...p, expired: p.expiresAt <= now })),
    coupons: coupons.map((c) => ({
      ...c,
      status: c.usedAt ? "USED" : c.expiresAt <= now ? "EXPIRED" : "ACTIVE",
    })),
  };
}

async function getOrganizerProfile(id) {
  const organizer = await prisma.user.findFirst({
    where: { id, role: "ORGANIZER" },
    select: { id: true, name: true, bio: true, avatarId: true, createdAt: true },
  });
  if (!organizer) throw new AppError(404, "Organizer tidak ditemukan");

  const [events, reviews] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId: id, startDate: { gt: new Date() } },
      include: { category: true, ticketTypes: { select: { price: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.review.findMany({
      where: { event: { organizerId: id } },
      include: {
        user: { select: { name: true, avatarId: true } },
        event: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return {
    ...organizer,
    rating: reviews.length ? Number((total / reviews.length).toFixed(1)) : 0,
    reviewCount: reviews.length,
    breakdown,
    events,
    reviews,
  };
}

module.exports = { updateProfile, changePassword, pointBalance, getRewards, getOrganizerProfile };
