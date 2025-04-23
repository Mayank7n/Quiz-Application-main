const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const { verifyAdmin } = require("../middleware/authMiddleware");

// Get all quizzes created by admin
router.get("/quizzes", verifyAdmin, async (req, res) => {
  try {
    // Only quizzes created by this admin
    const quizzes = await Quiz.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error("Admin Get Quizzes Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get attempt count for a quiz
router.get("/quiz/:id/attempts", verifyAdmin, async (req, res) => {
  try {
    const quizId = req.params.id;
    const count = await QuizResult.countDocuments({ quiz: quizId });
    res.json({ count });
  } catch (error) {
    console.error("Admin Get Quiz Attempts Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete quiz (already exists in quizRoutes, but for admin panel convenience)
router.delete("/quiz/:id", verifyAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found or not authorized" });
    }
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Admin Delete Quiz Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
