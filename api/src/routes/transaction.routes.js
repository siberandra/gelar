const { Router } = require("express");
const controller = require("../controllers/transaction.controller");
const { authenticate, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/upload");
const schema = require("../validations");

const router = Router();
const customer = [authenticate, authorize("CUSTOMER")];
const organizer = [authenticate, authorize("ORGANIZER")];

router.post("/transactions", customer, validate(schema.checkout), controller.checkout);
router.get("/transactions", customer, validate(schema.transactionQuery, "query"), controller.listMine);
router.get("/transactions/:id", customer, controller.getMine);
router.post("/transactions/:id/proof", customer, upload.single("proof"), controller.uploadProof);
router.post("/transactions/:id/cancel", customer, controller.cancel);

router.get("/dashboard/summary", organizer, controller.summary);
router.get("/dashboard/stats", organizer, validate(schema.stats, "query"), controller.stats);
router.get("/dashboard/events", organizer, controller.myEvents);
router.get("/dashboard/transactions", organizer, validate(schema.transactionQuery, "query"), controller.organizerTransactions);
router.post("/dashboard/transactions/:id/accept", organizer, controller.accept);
router.post("/dashboard/transactions/:id/reject", organizer, controller.reject);
router.get("/dashboard/events/:id/attendees", organizer, controller.attendees);

module.exports = router;
