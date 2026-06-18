const Expense = require('../models/Expense');
const logger = require('../utils/logger');

// Create a new Expense
exports.createExpense = async (req, res) => {
    try {
        const { amount, date, description } = req.body;

        if (amount === undefined || amount === null) {
            return res.status(400).json({
                success: false,
                message: 'Amount is required'
            });
        }

        const expense = new Expense({
            amount,
            date: date || new Date(),
            description: description || ''
        });

        await expense.save();
        logger.info(`Expense created: ${expense.amount} on ${expense.date}`);

        return res.status(201).json({
            success: true,
            message: 'Expense created successfully',
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

// Get All Expenses
exports.getExpenses = async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;
        let query = {};

        if (search) {
            query.description = { $regex: search, $options: 'i' };
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
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

// Get Single Expense by ID
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

// Update/Edit Expense
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

        if (amount !== undefined) expense.amount = amount;
        if (date !== undefined) expense.date = date;
        if (description !== undefined) expense.description = description;

        await expense.save();
        logger.info(`Expense updated: ID ${expense._id}`);

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

// Delete Expense
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        await Expense.deleteOne({ _id: req.params.id });
        logger.info(`Expense deleted: ID ${req.params.id}`);

        return res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
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
