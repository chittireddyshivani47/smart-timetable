const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const classrooms = await Classroom.find({ createdBy: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: classrooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const classroom = await Classroom.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: classroom });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body, { new: true, runValidators: true }
    );
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found' });
    res.json({ success: true, data: classroom });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!classroom) return res.status(404).json({ success: false, message: 'Classroom not found' });
    res.json({ success: true, message: 'Classroom deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
