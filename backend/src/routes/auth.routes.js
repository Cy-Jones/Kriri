const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken, requireAuth, optionalAuth } = require("../middleware/auth.middleware");

router.post("/sync", requireAuth, authController.sync);
router.get("/me", verifyToken, authController.me);
router.get("/check-username", optionalAuth, authController.checkUsername);
router.patch("/username", verifyToken, authController.updateUsername);
router.delete("/account", verifyToken, authController.deleteAccount);

module.exports = router;
