const eventService = require("../services/event.service");
const voucherService = require("../services/voucher.service");
const reviewService = require("../services/review.service");

const id = (req) => Number(req.params.id);

async function list(req, res) {
  res.json(await eventService.listEvents(req.validQuery));
}

async function detail(req, res) {
  res.json(await eventService.getEventBySlug(req.params.slug));
}

async function categories(req, res) {
  res.json(await eventService.listCategories());
}

async function cities(req, res) {
  res.json(await eventService.listCities());
}

async function create(req, res) {
  res.status(201).json(await eventService.createEvent(req.user.id, req.body, req.file));
}

async function update(req, res) {
  res.json(await eventService.updateEvent(id(req), req.user.id, req.body, req.file));
}

async function remove(req, res) {
  await eventService.deleteEvent(id(req), req.user.id);
  res.status(204).end();
}

async function listVouchers(req, res) {
  res.json(await voucherService.listVouchers(id(req), req.user.id));
}

async function createVoucher(req, res) {
  res.status(201).json(await voucherService.createVoucher(id(req), req.user.id, req.body));
}

async function deleteVoucher(req, res) {
  await voucherService.deleteVoucher(id(req), req.user.id);
  res.status(204).end();
}

async function checkVoucher(req, res) {
  const { eventId, code } = req.validQuery;
  const voucher = await voucherService.findValidVoucher(eventId, code);
  res.json({ code: voucher.code, discount: voucher.discount });
}

async function createReview(req, res) {
  res.status(201).json(await reviewService.createReview(req.user.id, id(req), req.body));
}

module.exports = {
  list,
  detail,
  categories,
  cities,
  create,
  update,
  remove,
  listVouchers,
  createVoucher,
  deleteVoucher,
  checkVoucher,
  createReview,
};
