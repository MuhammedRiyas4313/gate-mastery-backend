const Exam = require('../models/Exam');

const getExams = async (req, res) => {
  try {
    const exams = await Exam.find({ user: req.user._id }).sort({ date: 1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addExam = async (req, res) => {
  try {
    const { title, date, category } = req.body;
    const newExam = await Exam.create({
      user: req.user._id,
      title,
      date: new Date(date),
      category
    });
    res.status(201).json(newExam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || exam.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    exam.title = req.body.title || exam.title;
    exam.date = req.body.date ? new Date(req.body.date) : exam.date;
    exam.category = req.body.category || exam.category;
    exam.active = req.body.active !== undefined ? req.body.active : exam.active;
    
    const saved = await exam.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || exam.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    await exam.deleteOne();
    res.json({ message: 'Exam removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExams, addExam, updateExam, deleteExam };
