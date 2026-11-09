const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../src/lib/prisma");
const { randomCode } = require("../src/utils/code");
const { addDays, addHours } = require("../src/utils/date");

async function resetDb() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE point_usages, transaction_items, transactions, reviews, vouchers, ticket_types, events,
             categories, points, coupons, password_resets, users, files RESTART IDENTITY CASCADE
  `);
}

const hashed = bcrypt.hashSync("password123", 4);

async function createUser(role = "CUSTOMER", data = {}) {
  const user = await prisma.user.create({
    data: {
      name: data.name || `User ${randomCode(4)}`,
      email: data.email || `${randomCode(8).toLowerCase()}@test.id`,
      password: hashed,
      role,
      referralCode: randomCode(8),
      ...data,
    },
  });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
  return { user, token, auth: { Authorization: `Bearer ${token}` } };
}

async function createEvent(organizerId, options = {}) {
  const category = options.categoryId
    ? null
    : await prisma.category.create({ data: { name: "Musik", slug: `musik-${randomCode(6).toLowerCase()}` } });

  const startDate = options.startDate || addDays(new Date(), 10);
  return prisma.event.create({
    data: {
      organizerId,
      categoryId: options.categoryId || category.id,
      title: options.title || "Konser Test",
      slug: `konser-${randomCode(6).toLowerCase()}`,
      description: "Deskripsi acara untuk keperluan pengujian.",
      city: options.city || "Jakarta",
      venue: "Gedung Test",
      startDate,
      endDate: options.endDate || addHours(startDate, 3),
      ticketTypes: {
        create: (options.tickets || [{ name: "Reguler", price: 100000, quota: 10 }]).map((t) => ({
          ...t,
          available: t.quota,
        })),
      },
    },
    include: { ticketTypes: true, category: true },
  });
}

module.exports = { prisma, resetDb, createUser, createEvent };
