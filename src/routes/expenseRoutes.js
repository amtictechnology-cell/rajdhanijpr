const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all expense routes with authentication
router.use(authMiddleware);

// POST - Create expense
router.post('/', expenseController.createExpense);

// GET - Read all expenses
router.get('/', expenseController.getExpenses);

// GET - Read single expense details
router.get('/:id', expenseController.getExpenseById);

// PUT - Update expense
router.put('/:id', expenseController.updateExpense);

// DELETE - Delete expense
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
