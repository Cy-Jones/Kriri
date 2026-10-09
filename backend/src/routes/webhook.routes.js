const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook.controller");

// Clerk Webhooks require raw body for signature verification
router.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  webhookController.handleClerkWebhook,
);

module.exports = router;
