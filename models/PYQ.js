const mongoose = require('mongoose');

const pyqSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  year: String,
  source: String,
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
  status: { type: String, enum: ['PENDING', 'ONGOING', 'COMPLETED'], default: 'PENDING' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  notes: String,
  completedAt: Date,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PYQ', pyqSchema);
