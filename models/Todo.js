const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  completed: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Todo', todoSchema);
