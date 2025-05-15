const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  answers: [{
    type: String,
    required: true,
  }],
  score: {
    type: Number,
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  terminated: {
    type: Boolean,
    default: false,
  },
  terminatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  terminatedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("QuizResult", quizResultSchema);
