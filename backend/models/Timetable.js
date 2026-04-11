const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day: { type: String, required: true },
  timeSlot: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  isBreak: { type: Boolean, default: false },
  breakLabel: { type: String },
  className: { type: String }
});

const timetableSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  academicYear: { type: String },
  semester: { type: String },
  department: { type: String },
  className: { type: String },
  workingDays: [{ type: String }],
  timeSlots: [{ type: String }],
  breakSlots: [{ type: String }],
  slots: [slotSchema],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  generationStats: {
    conflicts: { type: Number, default: 0 },
    iterations: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

timetableSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Timetable', timetableSchema);
