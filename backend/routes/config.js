const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Default config - no DB needed for these defaults
router.get('/defaults', protect, (req, res) => {
  res.json({
    success: true,
    data: {
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timeSlots: [
        '8:00 AM - 8:55 AM',
        '9:00 AM - 9:55 AM',
        '10:00 AM - 10:55 AM',
        '11:00 AM - 11:55 AM',
        '12:00 PM - 12:55 PM',
        '1:00 PM - 1:55 PM',
        '2:00 PM - 2:55 PM',
        '3:00 PM - 3:55 PM',
        '4:00 PM - 4:55 PM'
      ],
      breakSlots: ['12:00 PM - 12:55 PM'],
      subjectColors: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
      ]
    }
  });
});

module.exports = router;
