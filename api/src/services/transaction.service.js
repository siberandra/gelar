const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { invoiceNumber } = require("../utils/code");
const { addHours, addDays } = require("../utils/date");
const { calculatePrice } = require("../utils/price");
const { findValidVoucher } = require("./voucher.service");
const { pointBalance } = require("./profile.service");
const { saveFile } = require("./file.service");
const mail = require("./mail.service");

const PAYMENT_HOURS = 2;
const CONFIRM_DAYS = 3;
const MAX_TICKETS = 10;

function mergeItems(items) {
  const map = new Map();
  for (const item of items) {
    map.set(item.ticketTypeId, (map.get(item.ticketTypeId) || 0) + item.quantity);
  }
  return [...map].map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));
}

async function checkout(userId, { eventId, items, voucherCode, couponId, usePoints }) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new AppError(404, "Acara tidak ditemukan");
  if (event.startDate <= new Date()) throw new AppError(400, "Penjualan tiket untuk acara ini sudah ditutup");

  const merged = mergeItems(items);
  const totalQty = merged.reduce((sum, i) => sum + i.quantity, 0);
  if (totalQty > MAX_TICKETS) throw new AppError(400, `Maksimal ${MAX_TICKETS} tiket per transaksi`);

  // satu SQL transaction
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    // 1. ambil harga tiket dari database
    const ticketTypes = await tx.ticketType.findMany({
      where: { eventId, id: { in: merged.map((i) => i.ticketTypeId) } },
    });
    if (ticketTypes.length !== merged.length) throw new AppError(400, "Jenis tiket tidak valid");
    const priceOf = (id) => ticketTypes.find((t) => t.id === id);
    const subtotal = merged.reduce((sum, i) => sum + priceOf(i.ticketTypeId).price * i.quantity, 0);

    // 2. cek voucher, kupon, poin, lalu hitung harga akhir
    const voucher = voucherCode ? await findValidVoucher(eventId, voucherCode, tx) : null;

    let coupon = null;
    if (couponId) {
      coupon = await tx.coupon.findFirst({ where: { id: couponId, userId } });
      if (!coupon || coupon.usedAt || coupon.expiresAt <= now) {
        throw new AppError(400, "Kupon tidak bisa dipakai");
      }
    }

    const balance = usePoints ? await pointBalance(userId, tx) : 0;
    const price = calculatePrice({
      subtotal,
      voucherDiscount: voucher ? voucher.discount : 0,
      coupon,
      pointBalance: balance,
      usePoints,
    });
    if (voucher && price.voucherDiscount === 0) throw new AppError(400, "Voucher tidak bisa dipakai untuk tiket gratis");
    if (coupon && price.couponDiscount === 0) throw new AppError(400, "Kupon tidak bisa dipakai untuk transaksi ini");

    // 3. kurangi kursi (hanya kalau masih cukup)
    for (const item of merged) {
      const result = await tx.ticketType.updateMany({
        where: { id: item.ticketTypeId, available: { gte: item.quantity } },
        data: { available: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        throw new AppError(400, `Kursi untuk tiket ${priceOf(item.ticketTypeId).name} tidak cukup`);
      }
    }

    // 4. pakai voucher dan kupon
    if (voucher) {
      const result = await tx.voucher.updateMany({
        where: { id: voucher.id, used: { lt: voucher.quota } },
        data: { used: { increment: 1 } },
      });
      if (result.count === 0) throw new AppError(400, "Kuota voucher sudah habis");
    }
    if (coupon) {
      const result = await tx.coupon.updateMany({
        where: { id: coupon.id, usedAt: null },
        data: { usedAt: now },
      });
      if (result.count === 0) throw new AppError(400, "Kupon sudah dipakai");
    }

    // 5. potong poin, yang paling cepat hangus dulu
    const pointUsages = [];
    let need = price.pointsUsed;
    if (need > 0) {
      const points = await tx.point.findMany({
        where: { userId, remaining: { gt: 0 }, expiresAt: { gt: now } },
        orderBy: [{ expiresAt: "asc" }, { id: "asc" }],
      });
      for (const point of points) {
        if (need === 0) break;
        const take = Math.min(point.remaining, need);
        const result = await tx.point.updateMany({
          where: { id: point.id, remaining: { gte: take } },
          data: { remaining: { decrement: take } },
        });
        if (result.count === 0) throw new AppError(409, "Saldo poin berubah, silakan coba lagi");
        pointUsages.push({ pointId: point.id, amount: take });
        need -= take;
      }
      if (need > 0) throw new AppError(400, "Saldo poin tidak cukup");
    }

    // 6. simpan transaksi
    return tx.transaction.create({
      data: {
        invoice: invoiceNumber(),
        userId,
        eventId,
        status: price.total === 0 ? "DONE" : "WAITING_PAYMENT",
        ...price,
        voucherId: voucher ? voucher.id : null,
        couponId: coupon ? coupon.id : null,
        paymentDeadline: addHours(now, PAYMENT_HOURS),
        items: {
          create: merged.map((i) => ({
            ticketTypeId: i.ticketTypeId,
            quantity: i.quantity,
            unitPrice: priceOf(i.ticketTypeId).price,
          })),
        },
        pointUsages: { create: pointUsages },
      },
      include: { items: true },
    });
  });
}

// rollback: kembalikan kursi, voucher, kupon, dan poin
async function releaseTransaction(id, fromStatuses, toStatus) {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.transaction.updateMany({
      where: { id, status: { in: fromStatuses } },
      data: { status: toStatus },
    });
    if (changed.count === 0) return null;

    const transaction = await tx.transaction.findUnique({
      where: { id },
      include: { items: true, pointUsages: true },
    });

    for (const item of transaction.items) {
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { available: { increment: item.quantity } },
      });
    }
    if (transaction.voucherId) {
      await tx.voucher.update({ where: { id: transaction.voucherId }, data: { used: { decrement: 1 } } });
    }
    if (transaction.couponId) {
      await tx.coupon.update({ where: { id: transaction.couponId }, data: { usedAt: null } });
    }
    for (const usage of transaction.pointUsages) {
      await tx.point.update({ where: { id: usage.pointId }, data: { remaining: { increment: usage.amount } } });
    }
    return transaction;
  });
}

async function expireOverdue(now = new Date()) {
  const [unpaid, unconfirmed] = await Promise.all([
    prisma.transaction.findMany({
      where: { status: "WAITING_PAYMENT", paymentDeadline: { lt: now } },
      select: { id: true },
    }),
    prisma.transaction.findMany({
      where: { status: "WAITING_CONFIRMATION", confirmDeadline: { lt: now } },
      select: { id: true },
    }),
  ]);

  for (const t of unpaid) await releaseTransaction(t.id, ["WAITING_PAYMENT"], "EXPIRED");
  for (const t of unconfirmed) await releaseTransaction(t.id, ["WAITING_CONFIRMATION"], "CANCELED");

  return { expired: unpaid.length, canceled: unconfirmed.length };
}

async function getOwnTransaction(userId, id) {
  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.userId !== userId) throw new AppError(404, "Transaksi tidak ditemukan");
  return transaction;
}

async function uploadProof(userId, id, file) {
  if (!file) throw new AppError(400, "Bukti bayar wajib diupload");
  await expireOverdue();
  const transaction = await getOwnTransaction(userId, id);
  if (transaction.status !== "WAITING_PAYMENT") {
    throw new AppError(400, "Bukti bayar hanya bisa diupload saat menunggu pembayaran");
  }

  return prisma.$transaction(async (tx) => {
    const proof = await saveFile(file, userId, true, tx);
    const result = await tx.transaction.updateMany({
      where: { id, status: "WAITING_PAYMENT" },
      data: {
        status: "WAITING_CONFIRMATION",
        proofId: proof.id,
        confirmDeadline: addDays(new Date(), CONFIRM_DAYS),
      },
    });
    if (result.count === 0) throw new AppError(400, "Status transaksi sudah berubah");
    return tx.transaction.findUnique({ where: { id } });
  });
}

async function cancelByCustomer(userId, id) {
  await getOwnTransaction(userId, id);
  const result = await releaseTransaction(id, ["WAITING_PAYMENT"], "CANCELED");
  if (!result) throw new AppError(400, "Transaksi ini tidak bisa dibatalkan");
  return result;
}

const detailInclude = {
  event: {
    select: { id: true, title: true, slug: true, imageId: true, startDate: true, endDate: true, city: true, venue: true },
  },
  items: { include: { ticketType: { select: { name: true } } } },
  coupon: { select: { code: true } },
  voucher: { select: { code: true } },
};

async function listMine(userId, status) {
  await expireOverdue();
  const where = { userId };
  if (status) where.status = { in: status.split(",") };

  const [transactions, reviews] = await Promise.all([
    prisma.transaction.findMany({ where, include: detailInclude, orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ where: { userId }, select: { eventId: true } }),
  ]);
  const reviewed = new Set(reviews.map((r) => r.eventId));
  const now = new Date();

  return transactions.map((t) => ({
    ...t,
    canReview: t.status === "DONE" && t.event.endDate < now && !reviewed.has(t.eventId),
  }));
}

async function getMine(userId, id) {
  await expireOverdue();
  await getOwnTransaction(userId, id);
  return prisma.transaction.findUnique({ where: { id }, include: detailInclude });
}

async function getOrganizerTransaction(organizerId, id) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { event: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!transaction || transaction.event.organizerId !== organizerId) {
    throw new AppError(404, "Transaksi tidak ditemukan");
  }
  return transaction;
}

async function listForOrganizer(organizerId, { status, eventId }) {
  await expireOverdue();
  const where = { event: { organizerId } };
  if (status) where.status = { in: status.split(",") };
  if (eventId) where.eventId = eventId;

  return prisma.transaction.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      event: { select: { title: true } },
      items: { include: { ticketType: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function accept(organizerId, id) {
  await expireOverdue();
  const transaction = await getOrganizerTransaction(organizerId, id);
  const result = await prisma.transaction.updateMany({
    where: { id, status: "WAITING_CONFIRMATION" },
    data: { status: "DONE" },
  });
  if (result.count === 0) throw new AppError(400, "Transaksi ini tidak sedang menunggu konfirmasi");

  await mail.sendTransactionResult(transaction, transaction.user, transaction.event, true);
  return { ...transaction, status: "DONE" };
}

async function reject(organizerId, id) {
  await expireOverdue();
  const transaction = await getOrganizerTransaction(organizerId, id);
  const result = await releaseTransaction(id, ["WAITING_CONFIRMATION"], "REJECTED");
  if (!result) throw new AppError(400, "Transaksi ini tidak sedang menunggu konfirmasi");

  await mail.sendTransactionResult(transaction, transaction.user, transaction.event, false);
  return { ...transaction, status: "REJECTED" };
}

module.exports = {
  checkout,
  releaseTransaction,
  expireOverdue,
  uploadProof,
  cancelByCustomer,
  listMine,
  getMine,
  listForOrganizer,
  accept,
  reject,
};
