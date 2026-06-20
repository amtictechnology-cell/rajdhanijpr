const Expense = require('../models/Expense');
const logger = require('../utils/logger');

// Create a new Expense (POST)
exports.createExpense = async (req, res) => {
    try {
        const { amount, date, description } = req.body;

        // Basic validation
        if (amount === undefined || !description) {
            return res.status(400).json({
                success: false,
                message: 'Amount and description are required'
            });
        }

        const expenseData = {
            amount: Number(amount),
            description: description.trim()
        };

        if (date) {
            expenseData.date = new Date(date);
        }

        const expense = new Expense(expenseData);
        await expense.save();

        logger.info(`Expense created: ${expense.description} - Amount: ${expense.amount}`);

        return res.status(201).json({
            success: true,
            message: 'Expense added successfully',
            expense
        });
    } catch (error) {
        logger.error(`Error in createExpense: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during expense creation',
            error: error.message
        });
    }
};

// Get All Expenses (GET)
exports.getExpenses = async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;
        let query = {};

        // Search in description
        if (search) {
            query.description = { $regex: search, $options: 'i' };
        }

        // Date range filtering
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set end date to the end of that day (23:59:59.999) to cover the full day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const expenses = await Expense.find(query).sort({ date: -1 });

        return res.status(200).json({
            success: true,
            count: expenses.length,
            expenses
        });
    } catch (error) {
        logger.error(`Error in getExpenses: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching expenses',
            error: error.message
        });
    }
};

// Get Single Expense by ID (GET)
exports.getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        return res.status(200).json({
            success: true,
            expense
        });
    } catch (error) {
        logger.error(`Error in getExpenseById: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching expense details',
            error: error.message
        });
    }
};

// Update/Edit Expense (PUT)
exports.updateExpense = async (req, res) => {
    try {
        const { amount, date, description } = req.body;

        let expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Update fields if provided
        if (amount !== undefined) expense.amount = Number(amount);
        if (date !== undefined) expense.date = new Date(date);
        if (description !== undefined) expense.description = description.trim();

        await expense.save();
        logger.info(`Expense updated: ${expense._id}`);

        return res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            expense
        });
    } catch (error) {
        logger.error(`Error in updateExpense: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during expense update',
            error: error.message
        });
    }
};

// Delete Expense (DELETE)
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        logger.info(`Expense deleted: ${expense._id}`);

        return res.status(200).json({
            success: true,
            message: 'Expense deleted successfully',
            expense
        });
    } catch (error) {
        logger.error(`Error in deleteExpense: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during expense deletion',
            error: error.message
        });
    }
};
