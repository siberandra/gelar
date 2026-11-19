const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { getOwnedEvent } = require("./event.service");

async function listVouchers(eventId, organizerId) {
  await getOwnedEvent(eventId, organizerId);
  return prisma.voucher.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } });
}

async function createVoucher(eventId, organizerId, data) {
  const event = await getOwnedEvent(eventId, organizerId);
  if (data.endDate <= data.startDate) throw new AppError(400, "Tanggal berakhir harus setelah tanggal mulai");
  if (data.endDate > event.endDate) throw new AppError(400, "Voucher harus berakhir sebelum acara selesai");

  const code = data.code.toUpperCase();
  const exists = await prisma.voucher.findUnique({ where: { eventId_code: { eventId, code } } });
  if (exists) throw new AppError(409, "Kode voucher sudah dipakai di acara ini");

  return prisma.voucher.create({ data: { ...data, code, eventId } });
}

async function deleteVoucher(voucherId, organizerId) {
  const voucher = await prisma.voucher.findUnique({ where: { id: voucherId }, include: { event: true } });
  if (!voucher) throw new AppError(404, "Voucher tidak ditemukan");
  if (voucher.event.organizerId !== organizerId) throw new AppError(403, "Ini bukan voucher milikmu");
  if (voucher.used > 0) throw new AppError(400, "Voucher yang sudah dipakai tidak bisa dihapus");
  await prisma.voucher.delete({ where: { id: voucherId } });
}

async function findValidVoucher(eventId, code, client = prisma) {
  const voucher = await client.voucher.findUnique({
    where: { eventId_code: { eventId, code: code.toUpperCase() } },
  });
  const now = new Date();
  if (!voucher) throw new AppError(400, "Kode voucher tidak ditemukan untuk acara ini");
  if (voucher.startDate > now) throw new AppError(400, "Voucher belum berlaku");
  if (voucher.endDate < now) throw new AppError(400, "Voucher sudah berakhir");
  if (voucher.used >= voucher.quota) throw new AppError(400, "Kuota voucher sudah habis");
  return voucher;
}

module.exports = { listVouchers, createVoucher, deleteVoucher, findValidVoucher };
