const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
  duration: { type: Number, required: true }, // in seconds
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  activityType: {
    type: String,
    enum: ['Lecture', 'Revision', 'PYQ', 'Quiz', 'DPP', 'Test Series'],
    default: 'Lecture'
  },
  status: { type: String, enum: ['COMPLETED'], default: 'COMPLETED' }
}, { timestamps: true });

module.exports = mongoose.model('StudySession', studySessionSchema);
