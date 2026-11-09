const { execSync } = require("child_process");

// Sebelum semua test: pastikan tabel di database test sesuai migrasi terbaru
module.exports = async () => {
  require("./setup-env");
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: process.env });
};
