const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

router.post('/submit', async (req, res) => {
  try {
    const { name, email, subject, message, rating, category } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const feedback = new Feedback({
      name,
      email,
      subject,
      message,
      rating: rating || 3,
      category: category || 'other',
    });

    await feedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
