const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const faculty = await Faculty.find({ createdBy: req.user._id }).populate('subjects').sort('-createdAt');
    res.json({ success: true, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const faculty = await Faculty.create({ ...req.body, createdBy: req.user._id });
    await faculty.populate('subjects');
    res.status(201).json({ success: true, data: faculty });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body, { new: true, runValidators: true }
    ).populate('subjects');
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, data: faculty });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const faculty = await Faculty.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, message: 'Faculty deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
