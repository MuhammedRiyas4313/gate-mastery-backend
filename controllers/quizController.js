const Quiz = require('../models/Quiz');

const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.user._id }).populate('subject').sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addQuiz = async (req, res) => {
  try {
    const quiz = new Quiz({ ...req.body, user: req.user._id });
    const saved = await quiz.save();
    const populated = await saved.populate('subject');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.body.id || req.params.id, user: req.user._id },
      req.body,
      { new: true }
    ).populate('subject');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getQuizzes, addQuiz, updateQuiz, deleteQuiz };
