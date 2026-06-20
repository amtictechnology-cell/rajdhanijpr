const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all expense routes with authentication
router.use(authMiddleware);

// POST - Add a new daily expense
router.post('/', expenseController.createExpense);

// GET - Get all expenses
router.get('/', expenseController.getExpenses);

// GET - Get single expense details by ID
router.get('/:id', expenseController.getExpenseById);

// PUT - Update/Edit expense details by ID
router.put('/:id', expenseController.updateExpense);

// DELETE - Delete expense by ID
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
