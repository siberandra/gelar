const multer = require("multer");
const AppError = require("../utils/AppError");

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new AppError(400, "Format gambar harus JPG, PNG, atau WEBP"));
    }
    cb(null, true);
  },
});

module.exports = upload;
