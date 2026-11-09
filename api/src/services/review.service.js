const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

// Boleh review jika punya transaksi DONE untuk acara itu dan acaranya sudah selesai (BR-15)
async function createReview(userId, eventId, { rating, comment }) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, "Acara tidak ditemukan");
  if (event.endDate > new Date()) throw new AppError(400, "Ulasan bisa diberikan setelah acara selesai");

  const attended = await prisma.transaction.findFirst({ where: { userId, eventId, status: "DONE" } });
  if (!attended) throw new AppError(403, "Hanya peserta acara yang bisa memberi ulasan");

  const exists = await prisma.review.findUnique({ where: { userId_eventId: { userId, eventId } } });
  if (exists) throw new AppError(409, "Kamu sudah memberi ulasan untuk acara ini");

  return prisma.review.create({ data: { userId, eventId, rating, comment } });
}

module.exports = { createReview };
