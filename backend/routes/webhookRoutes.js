const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");

// Stripe requires the raw body to verify the webhook signature
// We will use express.raw({type: 'application/json'}) in the route itself
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  billingController.handleStripeWebhook,
);

module.exports = router;
