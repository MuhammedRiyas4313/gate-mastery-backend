const mongoose = require('mongoose');

const testSeriesSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['CHAPTER', 'SUBJECT', 'FULL_LENGTH'], required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  status: { type: String, enum: ['PENDING', 'ONGOING', 'COMPLETED', 'MISSED'], default: 'PENDING' },
  notes: String,
  attemptedAt: Date,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('TestSeries', testSeriesSchema);
