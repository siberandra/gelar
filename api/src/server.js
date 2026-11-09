// Semua tanggal dihitung dengan waktu Indonesia (WIB), termasuk di server hosting
process.env.TZ = process.env.TZ || "Asia/Jakarta";
require("dotenv").config();

const app = require("./app");
const { startTransactionJob } = require("./jobs/transaction.job");

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`API berjalan di http://localhost:${port}`);
  startTransactionJob();
});
