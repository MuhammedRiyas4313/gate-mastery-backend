const Todo = require('../models/Todo');

// @desc    Get todos for a specific date
// @route   GET /api/planner/todos
// @access  Private
const getTodos = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const todos = await Todo.find({
      user: req.user._id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ createdAt: -1 });

    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get counts of todos per day for a range (for calendar dots)
// @route   GET /api/planner/summary
// @access  Private
const getTodoSummary = async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);

    const todos = await Todo.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    });

    const dayMap = {};
    todos.forEach(todo => {
      const dayStr = todo.date.toISOString().split('T')[0];
      if (!dayMap[dayStr]) {
        dayMap[dayStr] = { count: 0 };
      }
      dayMap[dayStr].count++;
    });

    res.json(dayMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a todo
// @route   POST /api/planner/todos
// @access  Private
const createTodo = async (req, res) => {
  try {
    const { title, date } = req.body;
    const todo = await Todo.create({
      user: req.user._id,
      title,
      date: new Date(date)
    });
    res.status(201).json(todo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a todo
// @route   PUT /api/planner/todos/:id
// @access  Private
const updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a todo
// @route   DELETE /api/planner/todos/:id
// @access  Private
const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json({ message: 'Todo removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTodos,
  getTodoSummary,
  createTodo,
  updateTodo,
  deleteTodo
};
