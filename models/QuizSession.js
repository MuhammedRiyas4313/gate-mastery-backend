const mongoose = require('mongoose');

const quizItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  status: { type: String, enum: ['PENDING', 'DONE', 'MISSED'], default: 'PENDING' },
  notes: String
});

const quizSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  dayName: { type: String, required: true }, // Removed enum for flexibility
  status: { type: String, enum: ['PENDING', 'ONGOING', 'COMPLETED'], default: 'PENDING' },
  quizzes: [quizItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('QuizSession', quizSessionSchema);
