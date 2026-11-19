const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

async function sendMail(to, subject, html) {
  try {
    const info = await getTransporter().sendMail({ from: process.env.MAIL_FROM, to, subject, html });
    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "test") {
      console.log(`[email] ke ${to}: ${subject}`);
    }
    return info;
  } catch (err) {
    console.error(`[email] gagal kirim ke ${to}:`, err.message);
    return null;
  }
}

const rupiah = (n) => "Rp " + n.toLocaleString("id-ID");

function sendTransactionResult(transaction, user, event, accepted) {
  const subject = accepted
    ? `Pembayaran diterima - ${event.title}`
    : `Pembayaran ditolak - ${event.title}`;
  const body = accepted
    ? `<p>Halo ${user.name},</p><p>Pembayaran untuk <b>${event.title}</b> (${transaction.invoice}) sebesar ${rupiah(transaction.total)} sudah <b>diterima</b>. Sampai jumpa di acara!</p>`
    : `<p>Halo ${user.name},</p><p>Maaf, pembayaran untuk <b>${event.title}</b> (${transaction.invoice}) <b>ditolak</b> oleh penyelenggara. Kursi, poin, voucher, dan kupon yang kamu pakai sudah dikembalikan.</p>`;
  return sendMail(user.email, subject, body);
}

function sendResetPassword(user, link) {
  return sendMail(
    user.email,
    "Reset password Gelar",
    `<p>Halo ${user.name},</p><p>Klik link berikut untuk membuat password baru (berlaku 1 jam):</p><p><a href="${link}">${link}</a></p><p>Abaikan email ini jika kamu tidak memintanya.</p>`
  );
}

module.exports = { sendMail, sendTransactionResult, sendResetPassword };
