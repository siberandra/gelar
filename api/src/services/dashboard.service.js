const prisma = require("../lib/prisma");
const { getOwnedEvent } = require("./event.service");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

async function summary(organizerId) {
  const [events, done, waiting] = await Promise.all([
    prisma.event.count({ where: { organizerId } }),
    prisma.transaction.findMany({
      where: { status: "DONE", event: { organizerId } },
      select: { total: true, items: { select: { quantity: true } } },
    }),
    prisma.transaction.count({ where: { status: "WAITING_CONFIRMATION", event: { organizerId } } }),
  ]);

  return {
    totalEvents: events,
    ticketsSold: done.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0),
    revenue: done.reduce((sum, t) => sum + t.total, 0),
    waitingConfirmation: waiting,
  };
}

// Data grafik penjualan (hanya transaksi DONE):
// - period=year  -> per tahun
// - period=month -> per bulan dalam tahun yang dipilih
// - period=day   -> per tanggal dalam bulan yang dipilih
async function stats(organizerId, { period, year, month, eventId }) {
  const where = { status: "DONE", event: { organizerId } };
  if (eventId) where.eventId = eventId;

  if (period === "month") {
    where.createdAt = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
  }
  if (period === "day") {
    where.createdAt = { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    select: { total: true, createdAt: true, items: { select: { quantity: true } } },
  });

  let buckets;
  let keyOf;
  if (period === "year") {
    const years = transactions.map((t) => t.createdAt.getFullYear());
    const first = years.length ? Math.min(...years) : year;
    const last = Math.max(year, ...years);
    buckets = [];
    for (let y = first; y <= last; y++) buckets.push({ key: y, label: String(y) });
    keyOf = (d) => d.getFullYear();
  } else if (period === "month") {
    buckets = MONTHS.map((label, i) => ({ key: i, label }));
    keyOf = (d) => d.getMonth();
  } else {
    const days = new Date(year, month, 0).getDate();
    buckets = Array.from({ length: days }, (_, i) => ({ key: i + 1, label: String(i + 1) }));
    keyOf = (d) => d.getDate();
  }

  const rows = buckets.map((b) => ({ label: b.label, key: b.key, revenue: 0, tickets: 0 }));
  for (const t of transactions) {
    const row = rows.find((r) => r.key === keyOf(t.createdAt));
    if (!row) continue;
    row.revenue += t.total;
    row.tickets += t.items.reduce((s, i) => s + i.quantity, 0);
  }
  return rows.map(({ key, ...rest }) => rest);
}

async function myEvents(organizerId) {
  const events = await prisma.event.findMany({
    where: { organizerId },
    include: { category: true, ticketTypes: true },
    orderBy: { startDate: "desc" },
  });
  const revenue = await prisma.transaction.groupBy({
    by: ["eventId"],
    where: { status: "DONE", event: { organizerId } },
    _sum: { total: true },
  });

  return events.map((e) => {
    const quota = e.ticketTypes.reduce((s, t) => s + t.quota, 0);
    const available = e.ticketTypes.reduce((s, t) => s + t.available, 0);
    const row = revenue.find((r) => r.eventId === e.id);
    return { ...e, quota, sold: quota - available, revenue: row ? row._sum.total : 0 };
  });
}

// Peserta = customer dengan transaksi DONE, dijumlahkan per orang
async function attendees(organizerId, eventId) {
  const event = await getOwnedEvent(eventId, organizerId);
  const transactions = await prisma.transaction.findMany({
    where: { eventId, status: "DONE" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { ticketType: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const byUser = new Map();
  for (const t of transactions) {
    const row = byUser.get(t.userId) || {
      userId: t.userId,
      name: t.user.name,
      email: t.user.email,
      tickets: [],
      quantity: 0,
      totalPaid: 0,
      firstPurchase: t.createdAt,
    };
    for (const item of t.items) {
      row.quantity += item.quantity;
      row.tickets.push(`${item.quantity}x ${item.ticketType.name}`);
    }
    row.totalPaid += t.total;
    byUser.set(t.userId, row);
  }

  const list = [...byUser.values()];
  return {
    event: { id: event.id, title: event.title, startDate: event.startDate },
    totalAttendees: list.length,
    totalTickets: list.reduce((s, a) => s + a.quantity, 0),
    totalRevenue: list.reduce((s, a) => s + a.totalPaid, 0),
    attendees: list,
  };
}

module.exports = { summary, stats, myEvents, attendees };
