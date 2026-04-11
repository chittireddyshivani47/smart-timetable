const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const Classroom = require('../models/Classroom');
const { protect } = require('../middleware/auth');
const TimetableCSP = require('../utils/cspAlgorithm');

router.use(protect);

// Get all timetables
router.get('/', async (req, res) => {
  try {
    const timetables = await Timetable.find({ createdBy: req.user._id })
      .select('-slots')
      .sort('-createdAt');
    res.json({ success: true, data: timetables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single timetable
router.get('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate('slots.subject')
      .populate('slots.faculty')
      .populate('slots.classroom');
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: timetable });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate timetable
router.post('/generate', async (req, res) => {
  try {
    const {
      name, academicYear, semester, department, className,
      subjectIds, facultyIds, classroomIds,
      workingDays, timeSlots, breakSlots,
      priorityMorning
    } = req.body;

    // Fetch data
    const subjects = await Subject.find({ _id: { $in: subjectIds }, createdBy: req.user._id });
    const faculty = await Faculty.find({ _id: { $in: facultyIds }, createdBy: req.user._id }).populate('subjects');
    const classrooms = await Classroom.find({ _id: { $in: classroomIds }, createdBy: req.user._id });

    if (subjects.length === 0) {
      return res.status(400).json({ success: false, message: 'No subjects found' });
    }

    // Run CSP algorithm
    const csp = new TimetableCSP({
      subjects,
      faculty,
      classrooms,
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timeSlots: timeSlots || ['8:00 AM - 8:55 AM', '9:00 AM - 9:55 AM', '10:00 AM - 10:55 AM',
        '11:00 AM - 11:55 AM', '12:00 PM - 12:55 PM', '1:00 PM - 1:55 PM',
        '2:00 PM - 2:55 PM', '3:00 PM - 3:55 PM'],
      breakSlots: breakSlots || ['12:00 PM - 12:55 PM'],
      className: className || 'Class A',
      priorityMorning
    });

    const result = csp.generate();

    // Save timetable
    const timetable = await Timetable.create({
      name,
      academicYear,
      semester,
      department,
      className,
      workingDays: workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      timeSlots: timeSlots || ['8:00 AM - 8:55 AM', '9:00 AM - 9:55 AM', '10:00 AM - 10:55 AM',
        '11:00 AM - 11:55 AM', '12:00 PM - 12:55 PM', '1:00 PM - 1:55 PM',
        '2:00 PM - 2:55 PM', '3:00 PM - 3:55 PM'],
      breakSlots: breakSlots || ['12:00 PM - 12:55 PM'],
      slots: result.slots.map(s => ({
        day: s.day,
        timeSlot: s.slot,
        subject: s.subject?._id || null,
        faculty: s.faculty?._id || null,
        classroom: s.classroom?._id || null,
        isBreak: s.isBreak || false,
        breakLabel: s.breakLabel || null,
        className: s.className
      })),
      generationStats: result.stats,
      createdBy: req.user._id
    });

    // Re-fetch with populated data
    const populated = await Timetable.findById(timetable._id)
      .populate('slots.subject')
      .populate('slots.faculty')
      .populate('slots.classroom');

    res.status(201).json({ success: true, data: populated, stats: result.stats });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update timetable (manual edit)
router.put('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('slots.subject').populate('slots.faculty').populate('slots.classroom');
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: timetable });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update single slot
router.patch('/:id/slot', async (req, res) => {
  try {
    const { day, timeSlot, subject, faculty, classroom } = req.body;
    const timetable = await Timetable.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });

    const slotIndex = timetable.slots.findIndex(
      s => s.day === day && s.timeSlot === timeSlot && !s.isBreak
    );

    if (slotIndex !== -1) {
      timetable.slots[slotIndex].subject = subject || null;
      timetable.slots[slotIndex].faculty = faculty || null;
      timetable.slots[slotIndex].classroom = classroom || null;
    } else {
      timetable.slots.push({ day, timeSlot, subject, faculty, classroom });
    }

    await timetable.save();
    const populated = await Timetable.findById(timetable._id)
      .populate('slots.subject').populate('slots.faculty').populate('slots.classroom');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete timetable
router.delete('/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, message: 'Timetable deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
