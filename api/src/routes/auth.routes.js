const { Router } = require("express");
const controller = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const schema = require("../validations");

const router = Router();

router.post("/register", validate(schema.register), controller.register);
router.post("/login", validate(schema.login), controller.login);
router.get("/me", authenticate, controller.me);
router.post("/forgot-password", validate(schema.forgotPassword), controller.forgotPassword);
router.post("/reset-password", validate(schema.resetPassword), controller.resetPassword);

module.exports = router;
