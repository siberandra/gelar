const transactionService = require("../services/transaction.service");
const dashboardService = require("../services/dashboard.service");

const id = (req) => Number(req.params.id);

// ---------- Customer ----------

async function checkout(req, res) {
  res.status(201).json(await transactionService.checkout(req.user.id, req.body));
}

async function listMine(req, res) {
  res.json(await transactionService.listMine(req.user.id, req.validQuery.status));
}

async function getMine(req, res) {
  res.json(await transactionService.getMine(req.user.id, id(req)));
}

async function uploadProof(req, res) {
  res.json(await transactionService.uploadProof(req.user.id, id(req), req.file));
}

async function cancel(req, res) {
  await transactionService.cancelByCustomer(req.user.id, id(req));
  res.json({ message: "Transaksi dibatalkan" });
}

// ---------- Organizer ----------

async function summary(req, res) {
  res.json(await dashboardService.summary(req.user.id));
}

async function stats(req, res) {
  res.json(await dashboardService.stats(req.user.id, req.validQuery));
}

async function myEvents(req, res) {
  res.json(await dashboardService.myEvents(req.user.id));
}

async function organizerTransactions(req, res) {
  res.json(await transactionService.listForOrganizer(req.user.id, req.validQuery));
}

async function accept(req, res) {
  await transactionService.accept(req.user.id, id(req));
  res.json({ message: "Transaksi diterima" });
}

async function reject(req, res) {
  await transactionService.reject(req.user.id, id(req));
  res.json({ message: "Transaksi ditolak" });
}

async function attendees(req, res) {
  res.json(await dashboardService.attendees(req.user.id, id(req)));
}

module.exports = {
  checkout,
  listMine,
  getMine,
  uploadProof,
  cancel,
  summary,
  stats,
  myEvents,
  organizerTransactions,
  accept,
  reject,
  attendees,
};
