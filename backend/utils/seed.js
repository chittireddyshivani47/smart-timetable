const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const Classroom = require('../models/Classroom');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_timetable';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Subject.deleteMany({});
  await Faculty.deleteMany({});
  await Classroom.deleteMany({});

  // Create admin user
  const user = await User.create({
    name: 'Admin User',
    email: 'admin@college.edu',
    password: 'admin123',
    institution: 'Sample University'
  });
  console.log('✅ Admin user created: admin@college.edu / admin123');

  // Create subjects
  const subjects = await Subject.insertMany([
    { name: 'Mathematics', code: 'MATH101', hoursPerWeek: 4, type: 'theory', isPriority: true, color: '#3B82F6', createdBy: user._id },
    { name: 'Physics', code: 'PHY101', hoursPerWeek: 3, type: 'theory', isPriority: true, color: '#10B981', createdBy: user._id },
    { name: 'Chemistry', code: 'CHEM101', hoursPerWeek: 3, type: 'theory', isPriority: false, color: '#F59E0B', createdBy: user._id },
    { name: 'Computer Science', code: 'CS101', hoursPerWeek: 4, type: 'theory', isPriority: true, color: '#8B5CF6', createdBy: user._id },
    { name: 'Physics Lab', code: 'PHY201', hoursPerWeek: 2, type: 'lab', isPriority: false, color: '#EC4899', createdBy: user._id },
    { name: 'Computer Lab', code: 'CS201', hoursPerWeek: 2, type: 'lab', isPriority: false, color: '#06B6D4', createdBy: user._id },
    { name: 'English', code: 'ENG101', hoursPerWeek: 2, type: 'theory', isPriority: false, color: '#F97316', createdBy: user._id },
    { name: 'Engineering Drawing', code: 'ED101', hoursPerWeek: 2, type: 'tutorial', isPriority: false, color: '#6366F1', createdBy: user._id },
  ]);
  console.log('✅ Subjects created:', subjects.length);

  // Create faculty
  const faculty = await Faculty.insertMany([
    { name: 'Dr. Rajesh Kumar', email: 'rajesh@college.edu', department: 'Mathematics', subjects: [subjects[0]._id], maxHoursPerDay: 6, createdBy: user._id },
    { name: 'Prof. Sunita Sharma', email: 'sunita@college.edu', department: 'Physics', subjects: [subjects[1]._id, subjects[4]._id], maxHoursPerDay: 5, createdBy: user._id },
    { name: 'Dr. Anil Verma', email: 'anil@college.edu', department: 'Chemistry', subjects: [subjects[2]._id], maxHoursPerDay: 6, createdBy: user._id },
    { name: 'Prof. Priya Patel', email: 'priya@college.edu', department: 'Computer Science', subjects: [subjects[3]._id, subjects[5]._id], maxHoursPerDay: 6, createdBy: user._id },
    { name: 'Dr. Mohan Das', email: 'mohan@college.edu', department: 'English', subjects: [subjects[6]._id], maxHoursPerDay: 4, createdBy: user._id },
    { name: 'Prof. Kavya Reddy', email: 'kavya@college.edu', department: 'Engineering', subjects: [subjects[7]._id], maxHoursPerDay: 5, createdBy: user._id },
  ]);
  console.log('✅ Faculty created:', faculty.length);

  // Create classrooms
  const classrooms = await Classroom.insertMany([
    { roomNumber: 'A101', building: 'Block A', capacity: 60, type: 'lecture', facilities: ['Projector', 'Whiteboard'], createdBy: user._id },
    { roomNumber: 'A102', building: 'Block A', capacity: 60, type: 'lecture', facilities: ['Projector', 'Whiteboard'], createdBy: user._id },
    { roomNumber: 'B201', building: 'Block B', capacity: 80, type: 'lecture', facilities: ['Projector', 'AC'], createdBy: user._id },
    { roomNumber: 'LAB01', building: 'Lab Block', capacity: 30, type: 'lab', facilities: ['Computers', 'AC'], createdBy: user._id },
    { roomNumber: 'LAB02', building: 'Lab Block', capacity: 30, type: 'lab', facilities: ['Equipment', 'Fume Hood'], createdBy: user._id },
    { roomNumber: 'SEM01', building: 'Main Block', capacity: 40, type: 'seminar', facilities: ['Projector', 'AC'], createdBy: user._id },
  ]);
  console.log('✅ Classrooms created:', classrooms.length);

  console.log('\n🎉 Seed complete! Login with: admin@college.edu / admin123');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
