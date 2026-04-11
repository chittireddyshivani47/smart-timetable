const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  hoursPerWeek: { type: Number, required: true, min: 1, max: 30 },
  type: { type: String, enum: ['theory', 'lab', 'tutorial'], default: 'theory' },
  isPriority: { type: Boolean, default: false },
  color: { type: String, default: '#3B82F6' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', subjectSchema);
