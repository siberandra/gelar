const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

function saveFile(file, ownerId, isPrivate = false, client = prisma) {
  return client.file.create({
    data: { mimeType: file.mimetype, data: file.buffer, ownerId, isPrivate },
  });
}

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
