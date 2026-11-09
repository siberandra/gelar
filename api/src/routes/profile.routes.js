const { Router } = require("express");
const controller = require("../controllers/profile.controller");
const { authenticate, optionalAuth, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/upload");
const schema = require("../validations");

const router = Router();

router.patch("/profile", authenticate, upload.single("avatar"), validate(schema.updateProfile), controller.update);
router.patch("/profile/password", authenticate, validate(schema.changePassword), controller.changePassword);
router.get("/profile/rewards", authenticate, authorize("CUSTOMER"), controller.rewards);
router.get("/organizers/:id", controller.organizer);
router.get("/files/:id", optionalAuth, controller.file);

module.exports = router;
