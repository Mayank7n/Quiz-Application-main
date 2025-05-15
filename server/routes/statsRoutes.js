const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Attempt = require('../models/Attempt');

// Get total number of quizzes
router.get('/quizzes/count', async (req, res) => {
  try {
    const count = await Quiz.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting quizzes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get total number of active users
router.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get total number of quiz attempts
router.get('/attempts/count', async (req, res) => {
  try {
    const count = await Attempt.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error counting attempts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
