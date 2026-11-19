const { Router } = require("express");
const controller = require("../controllers/event.controller");
const { authenticate, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/upload");
const schema = require("../validations");

const router = Router();
const organizer = [authenticate, authorize("ORGANIZER")];
const customer = [authenticate, authorize("CUSTOMER")];

router.get("/events", validate(schema.eventQuery, "query"), controller.list);
router.get("/events/:slug", controller.detail);
router.get("/categories", controller.categories);
router.get("/cities", controller.cities);
router.get("/highlights", controller.highlights);

router.post("/events", organizer, upload.single("image"), validate(schema.event), controller.create);
router.put("/events/:id", organizer, upload.single("image"), validate(schema.event), controller.update);
router.delete("/events/:id", organizer, controller.remove);

router.get("/events/:id/vouchers", organizer, controller.listVouchers);
router.post("/events/:id/vouchers", organizer, validate(schema.voucher), controller.createVoucher);
router.delete("/vouchers/:id", organizer, controller.deleteVoucher);
router.get("/vouchers/check", customer, validate(schema.voucherCheck, "query"), controller.checkVoucher);

router.post("/events/:id/reviews", customer, validate(schema.review), controller.createReview);

module.exports = router;
