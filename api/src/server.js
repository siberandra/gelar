// Semua tanggal dihitung dengan waktu Indonesia (WIB), termasuk di server hosting
process.env.TZ = process.env.TZ || "Asia/Jakarta";
require("dotenv").config();

// Lengkapi alamat web jika ditulis tanpa "https://"
if (process.env.WEB_URL && !process.env.WEB_URL.startsWith("http")) {
  process.env.WEB_URL = `https://${process.env.WEB_URL}`;
}

const app = require("./app");
const { startTransactionJob } = require("./jobs/transaction.job");

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`API berjalan di http://localhost:${port}`);
  startTransactionJob();
});
