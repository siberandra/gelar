// Pintu masuk API saat di-deploy ke Vercel (serverless).
// Saat development tetap pakai src/server.js.
process.env.TZ = process.env.TZ || "Asia/Jakarta";
require("dotenv").config();

const app = require("../src/app");
const { expireOverdue } = require("../src/services/transaction.service");

const EVERY_MINUTE = 60 * 1000;
let lastCheck = 0;

// Serverless tidak punya timer yang terus hidup, jadi transaksi yang
// lewat batas waktu dicek saat ada request masuk (paling sering sekali per menit)
module.exports = async (req, res) => {
  if (Date.now() - lastCheck > EVERY_MINUTE) {
    lastCheck = Date.now();
    try {
      await expireOverdue();
    } catch (err) {
      console.error("[job] gagal:", err.message);
    }
  }
  return app(req, res);
};
