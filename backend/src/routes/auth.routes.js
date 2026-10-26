const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken, requireAuth } = require("../middleware/auth.middleware");

router.post("/sync", requireAuth, authController.sync);
router.get("/me", verifyToken, authController.me);
router.delete("/account", verifyToken, authController.deleteAccount);

module.exports = router;
