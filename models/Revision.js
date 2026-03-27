const mongoose = require('mongoose');

const revisionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'ONGOING', 'COMPLETED', 'SNOOZED', 'SKIPPED'], default: 'PENDING' },
  tags: [{
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }
  }],
  type: { type: String, enum: ['CHAPTER_AUTO', 'DAILY', 'CUSTOM'], default: 'DAILY' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Revision', revisionSchema);

