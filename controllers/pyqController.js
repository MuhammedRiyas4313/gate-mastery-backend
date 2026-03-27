const PYQ = require('../models/PYQ');

// @desc    Get all PYQs
// @route   GET /api/pyqs
const getPYQs = async (req, res) => {
  try {
    const pyqs = await PYQ.find({ user: req.user._id })
      .populate('subject chapter topic')
      .sort({ createdAt: -1 });
    res.json(pyqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a manual PYQ
// @route   POST /api/pyqs
const addPYQ = async (req, res) => {
  try {
    const { title, year, source, difficulty, subjectId, chapterId, topicId, date, notes } = req.body;
    console.log("Adding PYQ:", req.body);
    const newPyq = await PYQ.create({
      user: req.user._id,
      title,
      year: year || '',
      source: source || 'GATE',
      difficulty: difficulty || 'MEDIUM',
      subject: subjectId || undefined,
      chapter: chapterId || undefined,
      topic: topicId || undefined,
      date: date ? new Date(date) : new Date(),
      status: 'PENDING',
      notes: notes || ''
    });

    const populated = await newPyq.populate('subject chapter topic');
    res.status(201).json(populated);
  } catch (error) {
    console.error("Error adding PYQ:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a PYQ
// @route   PUT /api/pyqs/:id
const updatePYQ = async (req, res) => {
  try {
    const pyq = await PYQ.findById(req.params.id);
    if (pyq && pyq.user.toString() === req.user._id.toString()) {
      pyq.title = req.body.title || pyq.title;
      pyq.year = req.body.year !== undefined ? req.body.year : pyq.year;
      pyq.source = req.body.source || pyq.source;
      pyq.difficulty = req.body.difficulty || pyq.difficulty;
      pyq.status = req.body.status || pyq.status;
      pyq.notes = req.body.notes !== undefined ? req.body.notes : pyq.notes;
      pyq.date = req.body.date ? new Date(req.body.date) : pyq.date;
      if (req.body.subjectId !== undefined) pyq.subject = req.body.subjectId ? req.body.subjectId : null;
      if (req.body.chapterId !== undefined) pyq.chapter = req.body.chapterId ? req.body.chapterId : null;
      if (req.body.topicId !== undefined) pyq.topic = req.body.topicId ? req.body.topicId : null;

      if (req.body.status === 'COMPLETED' && pyq.status !== 'COMPLETED') {
        pyq.completedAt = new Date();
      }
      
      const updated = await pyq.save();
      const populated = await updated.populate('subject chapter topic');
      res.json(populated);
    } else {
      res.status(404).json({ message: 'PYQ not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a PYQ
// @route   DELETE /api/pyqs/:id
const deletePYQ = async (req, res) => {
  try {
    const pyq = await PYQ.findById(req.params.id);
    if (!pyq) {
      return res.status(404).json({ message: 'PYQ not found' });
    }
    if (pyq.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await pyq.deleteOne();
    res.json({ message: 'PYQ removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPYQs, addPYQ, updatePYQ, deletePYQ };
