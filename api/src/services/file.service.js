const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

// Simpan file upload (dari multer) ke tabel files.
// client = prisma biasa, atau tx kalau dipanggil di dalam SQL transaction.
function saveFile(file, ownerId, isPrivate = false, client = prisma) {
  return client.file.create({
    data: { mimeType: file.mimetype, data: file.buffer, ownerId, isPrivate },
  });
}

// File publik (gambar acara, avatar) boleh dilihat siapa saja.
// Bukti bayar hanya untuk pembeli dan organizer acaranya.
async function getFile(id, user) {
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) throw new AppError(404, "File tidak ditemukan");
  if (!file.isPrivate) return file;

  if (!user) throw new AppError(401, "Silakan login terlebih dahulu");
  if (file.ownerId === user.id) return file;

  const transaction = await prisma.transaction.findFirst({
    where: { proofId: id, event: { organizerId: user.id } },
  });
  if (!transaction) throw new AppError(403, "Kamu tidak punya akses ke file ini");
  return file;
}

module.exports = { saveFile, getFile };
