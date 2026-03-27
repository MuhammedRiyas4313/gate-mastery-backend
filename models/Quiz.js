const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  weekNumber: Number,
  quizNumber: Number,
  scheduledDate: { type: Date, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  score: Number,
  totalMarks: Number,
  status: { type: String, enum: ['PENDING', 'DONE', 'MISSED'], default: 'PENDING' },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
