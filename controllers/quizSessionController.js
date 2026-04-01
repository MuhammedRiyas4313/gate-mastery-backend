const QuizSession = require('../models/QuizSession');

// @desc    Get all quiz sessions
// @route   GET /api/quiz-sessions
const getQuizSessions = async (req, res) => {
  try {
    const { sortBy } = req.query;
    let sortObj = { createdAt: -1 };
    if (sortBy === 'date') {
      sortObj = { date: -1 };
    }

    const sessions = await QuizSession.find({ user: req.user._id })
      .populate('quizzes.subject quizzes.chapter quizzes.topic')
      .sort(sortObj);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a manual quiz session
// @route   POST /api/quiz-sessions
const addQuizSession = async (req, res) => {
  try {
    const { date, status, quizzes } = req.body;
    const d = new Date(date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

    const newSession = await QuizSession.create({
      user: req.user._id,
      date: d,
      dayName: ['Saturday', 'Sunday'].includes(dayName) ? dayName : 'Saturday', // fallback for schema enum if needed, or I'll fix schema
      status: status || 'PENDING',
      quizzes: quizzes || []
    });

    const populated = await newSession.populate('quizzes.subject quizzes.chapter quizzes.topic');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a quiz session (status or quizzes list)
// @route   PUT /api/quiz-sessions/:id
const updateQuizSession = async (req, res) => {
  try {
    const session = await QuizSession.findById(req.params.id);
    if (session && session.user.toString() === req.user._id.toString()) {
      
      // Block completion if there are pending quizzes
      if (req.body.status === 'COMPLETED') {
        const quizzes = req.body.quizzes || session.quizzes;
        const hasPending = quizzes.some(q => q.status === 'PENDING');
        if (hasPending) {
          return res.status(400).json({ message: 'Sync interrupted: Secure all internal quiz marks before closing the vault.' });
        }
      }

      session.status = req.body.status || session.status;
      if (req.body.quizzes) session.quizzes = req.body.quizzes;
      if (req.body.date) {
          session.date = new Date(req.body.date);
          session.dayName = session.date.toLocaleDateString('en-US', { weekday: 'long' });
      }
      
      const updated = await session.save();
      const populated = await updated.populate('quizzes.subject quizzes.chapter quizzes.topic');
      res.json(populated);
    } else {
      res.status(404).json({ message: 'Session not found or not authorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a quiz session
// @route   DELETE /api/quiz-sessions/:id
const deleteQuizSession = async (req, res) => {
    try {
      const session = await QuizSession.findById(req.params.id);
      if (!session) return res.status(404).json({ message: 'Session not found' });
      if (session.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      await session.deleteOne();
      res.json({ message: 'Session removed' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

module.exports = { getQuizSessions, addQuizSession, updateQuizSession, deleteQuizSession };
