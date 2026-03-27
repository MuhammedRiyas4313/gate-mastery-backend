const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  orderIndex: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'ongoing', 'complete'], default: 'pending' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Chapter', chapterSchema);
