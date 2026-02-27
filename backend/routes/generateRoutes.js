const express = require("express");
const router = express.Router();
const {
  generatePrompt,
  generateVideoPrompt,
} = require("../controllers/generationController");
const { protect } = require("../middleware/authMiddleware");

// Public route for Fun mode
router.post("/fun", generatePrompt);

// Protected route for Pro mode
router.post("/pro", protect, generatePrompt);

// Protected route for Video mode
router.post("/video", protect, generateVideoPrompt);

module.exports = router;
