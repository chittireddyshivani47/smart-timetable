const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, trim: true },
  building: { type: String, trim: true },
  capacity: { type: Number, required: true, min: 1 },
  type: { type: String, enum: ['lecture', 'lab', 'seminar'], default: 'lecture' },
  facilities: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Classroom', classroomSchema);
