const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  orderIndex: { type: Number, default: 0 },
  dateTaught: { type: Date },
  status: { type: String, enum: ['pending', 'ongoing', 'complete'], default: 'pending' },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Topic', topicSchema);
