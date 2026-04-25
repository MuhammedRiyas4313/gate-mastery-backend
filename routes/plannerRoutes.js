const express = require('express');
const router = express.Router();
const { 
  getTodos, 
  getTodoSummary, 
  createTodo, 
  updateTodo, 
  deleteTodo 
} = require('../controllers/todoController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/todos', getTodos);
router.get('/summary', getTodoSummary);
router.post('/todos', createTodo);
router.put('/todos/:id', updateTodo);
router.delete('/todos/:id', deleteTodo);

module.exports = router;
