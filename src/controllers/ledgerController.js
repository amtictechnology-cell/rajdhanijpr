const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

// Add a transaction (gave or took)
exports.addTransaction = async (req, res) => {
    try {
        const { customerId, amount, type, date } = req.body;

        if (!customerId || !amount || !type) {
            return res.status(400).json({
                success: false,
                message: 'CustomerId, amount, and type are required'
            });
        }

        if (type !== 'gave' && type !== 'took') {
            return res.status(400).json({
                success: false,
                message: 'Type must be either "gave" or "took"'
            });
        }

        // Verify customer exists
        const customerExists = await Customer.findById(customerId);
        if (!customerExists) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        const transaction = new Transaction({
            customer: customerId,
            amount: Number(amount),
            type,
            date: date || new Date()
        });

        await transaction.save();
        logger.info(`Ledger transaction of type ${type} added for customer: ${customerExists.name}. Amount: ${amount}`);

        return res.status(201).json({
            success: true,
            message: 'Transaction recorded successfully',
            transaction
        });
    } catch (error) {
        logger.error(`Error in addTransaction: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during transaction creation',
            error: error.message
        });
    }
};

// Get ledger/transactions for a particular customer
exports.getCustomerLedger = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Verify customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Fetch all transactions sorted by date
        const transactions = await Transaction.find({ customer: customerId }).sort({ date: 1 });

        // Calculate balances
        let totalGave = 0; // advanced/paid to customer
        let totalTook = 0; // received from customer

        transactions.forEach(t => {
            if (t.type === 'gave') {
                totalGave += t.amount;
            } else if (t.type === 'took') {
                totalTook += t.amount;
            }
        });

        const netBalance = totalGave - totalTook;

        return res.status(200).json({
            success: true,
            customer: {
                id: customer._id,
                name: customer.name,
                mobileNo: customer.mobileNo
            },
            summary: {
                totalGave,
                totalTook,
                netBalance,
                status: netBalance > 0 ? 'Customer owes us' : netBalance < 0 ? 'We owe customer' : 'Settled'
            },
            count: transactions.length,
            transactions
        });
    } catch (error) {
        logger.error(`Error in getCustomerLedger: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching ledger details',
            error: error.message
        });
    }
};

// Update/Edit Transaction
exports.updateTransaction = async (req, res) => {
    try {
        const { amount, type, date, customerId } = req.body;

        let transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // If customer is changing, verify new customer exists
        if (customerId && customerId !== transaction.customer.toString()) {
            const customerExists = await Customer.findById(customerId);
            if (!customerExists) {
                return res.status(404).json({
                    success: false,
                    message: 'New customer not found'
                });
            }
            transaction.customer = customerId;
        }

        if (amount !== undefined) transaction.amount = Number(amount);
        if (type !== undefined) {
            if (type !== 'gave' && type !== 'took') {
                return res.status(400).json({
                    success: false,
                    message: 'Type must be either "gave" or "took"'
                });
            }
            transaction.type = type;
        }
        if (date !== undefined) transaction.date = date;

        await transaction.save();
        logger.info(`Transaction ID ${transaction._id} updated successfully`);

        return res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            transaction
        });
    } catch (error) {
        logger.error(`Error in updateTransaction: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during transaction update',
            error: error.message
        });
    }
};

// Delete Transaction
exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        await Transaction.deleteOne({ _id: req.params.id });
        logger.info(`Transaction ID ${transaction._id} deleted successfully`);

        return res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    } catch (error) {
        logger.error(`Error in deleteTransaction: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during transaction deletion',
            error: error.message
        });
    }
};
