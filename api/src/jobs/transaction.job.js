const { expireOverdue } = require("../services/transaction.service");

const EVERY_MINUTE = 60 * 1000;

// Cek tiap menit: transaksi yang lewat 2 jam -> EXPIRED, lewat 3 hari tanpa konfirmasi -> CANCELED
function startTransactionJob() {
  const run = async () => {
    try {
      const result = await expireOverdue();
      if (result.expired || result.canceled) {
        console.log(`[job] expired: ${result.expired}, canceled: ${result.canceled}`);
      }
    } catch (err) {
      console.error("[job] gagal:", err.message);
    }
  };
  run();
  return setInterval(run, EVERY_MINUTE);
}

module.exports = { startTransactionJob };
