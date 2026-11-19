const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { slugify, randomCode } = require("../utils/code");
const { saveFile } = require("./file.service");

const PAGE_SIZE = 12;

function withMinPrice(event) {
  const prices = event.ticketTypes.map((t) => t.price);
  return { ...event, minPrice: prices.length ? Math.min(...prices) : 0 };
}

const cardInclude = {
  category: true,
  organizer: { select: { id: true, name: true } },
  ticketTypes: { select: { price: true, available: true } },
};

async function listEvents({ search, category, city, price, page = 1 }) {
  const where = { startDate: { gt: new Date() } };
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (category) where.category = { slug: category };
  if (city) where.city = city;
  if (price === "free") where.ticketTypes = { every: { price: 0 } };
  if (price === "paid") where.ticketTypes = { some: { price: { gt: 0 } } };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: cardInclude,
      orderBy: { startDate: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    data: events.map(withMinPrice),
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
  };
}

async function getEventBySlug(slug) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      category: true,
      organizer: { select: { id: true, name: true, avatarId: true } },
      ticketTypes: { orderBy: { price: "asc" } },
      reviews: {
        include: { user: { select: { name: true, avatarId: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!event) throw new AppError(404, "Acara tidak ditemukan");

  const now = new Date();
  const vouchers = await prisma.voucher.findMany({
    where: { eventId: event.id, startDate: { lte: now }, endDate: { gte: now } },
    select: { code: true, discount: true, endDate: true, quota: true, used: true },
  });

  const organizerReviews = await prisma.review.aggregate({
    where: { event: { organizerId: event.organizer.id } },
    _avg: { rating: true },
    _count: true,
  });

  return {
    ...withMinPrice(event),
    promos: vouchers.filter((v) => v.used < v.quota).map(({ code, discount, endDate }) => ({ code, discount, endDate })),
    organizerRating: Number((organizerReviews._avg.rating || 0).toFixed(1)),
    organizerReviewCount: organizerReviews._count,
  };
}

async function listCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

async function listCities() {
  const rows = await prisma.event.findMany({
    where: { startDate: { gt: new Date() } },
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });
  return rows.map((r) => r.city);
}

async function getHighlights() {
  const now = new Date();
  const [events, tickets, cities, organizers, reviews] = await Promise.all([
    prisma.event.count({ where: { startDate: { gt: now } } }),
    prisma.transactionItem.aggregate({ where: { transaction: { status: "DONE" } }, _sum: { quantity: true } }),
    prisma.event.findMany({ distinct: ["city"], select: { city: true } }),
    prisma.user.count({ where: { role: "ORGANIZER" } }),
    prisma.review.findMany({
      where: { rating: { gte: 4 } },
      include: {
        user: { select: { name: true, avatarId: true } },
        event: { select: { title: true, slug: true } },
      },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ]);
  return {
    stats: { events, ticketsSold: tickets._sum.quantity || 0, cities: cities.length, organizers },
    reviews,
  };
}

async function getOwnedEvent(eventId, organizerId) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { ticketTypes: true } });
  if (!event) throw new AppError(404, "Acara tidak ditemukan");
  if (event.organizerId !== organizerId) throw new AppError(403, "Ini bukan acara milikmu");
  return event;
}

function checkDates(startDate, endDate) {
  if (endDate <= startDate) throw new AppError(400, "Tanggal selesai harus setelah tanggal mulai");
}

async function createEvent(organizerId, data, image) {
  checkDates(data.startDate, data.endDate);
  const { ticketTypes, ...fields } = data;

  return prisma.$transaction(async (tx) => {
    const imageFile = image ? await saveFile(image, organizerId, false, tx) : null;
    return tx.event.create({
      data: {
        ...fields,
        organizerId,
        slug: `${slugify(fields.title)}-${randomCode(4).toLowerCase()}`,
        imageId: imageFile ? imageFile.id : null,
        ticketTypes: {
          create: ticketTypes.map((t) => ({ ...t, available: t.quota })),
        },
      },
      include: { ticketTypes: true },
    });
  });
}

async function updateEvent(eventId, organizerId, data, image) {
  const event = await getOwnedEvent(eventId, organizerId);
  checkDates(data.startDate, data.endDate);
  const { ticketTypes, ...fields } = data;

  return prisma.$transaction(async (tx) => {
    const keepIds = ticketTypes.filter((t) => t.id).map((t) => t.id);

    for (const old of event.ticketTypes) {
      if (keepIds.includes(old.id)) continue;
      const sold = await tx.transactionItem.count({ where: { ticketTypeId: old.id } });
      if (sold > 0) throw new AppError(400, `Tiket "${old.name}" sudah pernah dibeli, tidak bisa dihapus`);
      await tx.ticketType.delete({ where: { id: old.id } });
    }

    for (const ticket of ticketTypes) {
      if (!ticket.id) {
        await tx.ticketType.create({ data: { ...ticket, eventId, available: ticket.quota } });
        continue;
      }
      const old = event.ticketTypes.find((t) => t.id === ticket.id);
      if (!old) throw new AppError(400, "Jenis tiket tidak ditemukan");
      const sold = old.quota - old.available;
      if (ticket.quota < sold) {
        throw new AppError(400, `Kuota "${ticket.name}" minimal ${sold} (sudah terjual)`);
      }
      await tx.ticketType.update({
        where: { id: ticket.id },
        data: { name: ticket.name, price: ticket.price, quota: ticket.quota, available: ticket.quota - sold },
      });
    }

    const update = { ...fields };
    if (image) update.imageId = (await saveFile(image, organizerId, false, tx)).id;

    return tx.event.update({ where: { id: eventId }, data: update, include: { ticketTypes: true } });
  });
}

async function deleteEvent(eventId, organizerId) {
  await getOwnedEvent(eventId, organizerId);
  const used = await prisma.transaction.count({ where: { eventId } });
  if (used > 0) throw new AppError(400, "Acara yang sudah punya transaksi tidak bisa dihapus");
  await prisma.event.delete({ where: { id: eventId } });
}

module.exports = {
  listEvents,
  getEventBySlug,
  listCategories,
  listCities,
  getHighlights,
  getOwnedEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};
