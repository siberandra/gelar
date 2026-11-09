const crypto = require("crypto");

// Tanpa huruf/angka yang mirip (O/0, I/1) supaya kode mudah diketik ulang
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length) {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function invoiceNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${today}-${randomCode(6)}`;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { randomCode, slugify, invoiceNumber, hashToken };
