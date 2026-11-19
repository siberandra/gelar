process.env.TZ = process.env.TZ || "Asia/Jakarta";
require("dotenv").config();

const app = require("../src/app");
const { expireOverdue } = require("../src/services/transaction.service");

const EVERY_MINUTE = 60 * 1000;
let lastCheck = 0;

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
