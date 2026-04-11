const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const Classroom = require('../models/Classroom');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only CSV and Excel files allowed'));
  }
});

router.use(protect);

// Upload subjects CSV
router.post('/subjects', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      try {
        const subjects = results.map(r => ({
          name: r.name || r.Name,
          code: r.code || r.Code,
          hoursPerWeek: parseInt(r.hoursPerWeek || r.hours_per_week || r.Hours) || 3,
          type: r.type || r.Type || 'theory',
          isPriority: r.isPriority === 'true' || r.priority === 'yes',
          createdBy: req.user._id
        })).filter(s => s.name && s.code);
        const created = await Subject.insertMany(subjects);
        fs.unlinkSync(req.file.path);
        res.json({ success: true, data: created, count: created.length });
      } catch (err) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ success: false, message: err.message });
      }
    });
});

// Upload faculty CSV
router.post('/faculty', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      try {
        const faculty = results.map(r => ({
          name: r.name || r.Name,
          email: r.email || r.Email,
          department: r.department || r.Department,
          maxHoursPerDay: parseInt(r.maxHoursPerDay || r.max_hours || 6),
          createdBy: req.user._id
        })).filter(f => f.name);
        const created = await Faculty.insertMany(faculty);
        fs.unlinkSync(req.file.path);
        res.json({ success: true, data: created, count: created.length });
      } catch (err) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ success: false, message: err.message });
      }
    });
});

// Sample CSV download
router.get('/sample/:type', protect, (req, res) => {
  const samples = {
    subjects: 'name,code,hoursPerWeek,type,isPriority\nMathematics,MATH101,4,theory,true\nPhysics,PHY101,3,theory,false\nChemistry Lab,CHEM201,2,lab,false',
    faculty: 'name,email,department,maxHoursPerDay\nDr. Smith,smith@college.edu,Science,6\nProf. Johnson,johnson@college.edu,Math,5',
    classrooms: 'roomNumber,building,capacity,type\nA101,Block A,60,lecture\nLAB01,Lab Block,30,lab'
  };
  const data = samples[req.params.type];
  if (!data) return res.status(404).json({ success: false, message: 'Invalid type' });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${req.params.type}_sample.csv`);
  res.send(data);
});

module.exports = router;
