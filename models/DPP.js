const mongoose = require('mongoose');

const dppSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'ONGOING', 'COMPLETED'], default: 'PENDING' },

  notes: { type: String },

  tags: [{ 
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
    topic:   { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }
  }]

}, { timestamps: true });

module.exports = mongoose.model('DPP', dppSchema);
