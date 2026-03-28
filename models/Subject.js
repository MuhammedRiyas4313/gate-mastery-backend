const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
  color: { type: String },
  startDate: { type: Date },
  status: { type: String, enum: ['pending', 'ongoing', 'complete'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalStudySeconds: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
