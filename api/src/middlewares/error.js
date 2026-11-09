const multer = require("multer");
const { Prisma } = require("@prisma/client");

function notFound(req, res) {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
}

// Semua error berakhir di sini dan dikirim dengan format { message }
function errorHandler(err, req, res, next) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Ukuran file maksimal 2 MB" : err.message;
    return res.status(400).json({ message });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return res.status(409).json({ message: "Data sudah ada" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Format JSON tidak valid" });
  }
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan di server" });
}

module.exports = { notFound, errorHandler };
