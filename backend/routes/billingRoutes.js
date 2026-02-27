const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const { protect } = require("../middleware/authMiddleware");

router.post(
  "/create-checkout-session",
  protect,
  billingController.createCheckoutSession,
);

module.exports = router;
