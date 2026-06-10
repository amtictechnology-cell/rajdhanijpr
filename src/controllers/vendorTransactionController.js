const VendorTransaction = require('../models/VendorTransaction');
const Vendor = require('../models/Vendor');
const logger = require('../utils/logger');

// Add a transaction (receive_goods or make_payment)
exports.addTransaction = async (req, res) => {
    try {
        const { vendorId, amount, type, goodsName, date } = req.body;

        if (!vendorId || !amount || !type) {
            return res.status(400).json({
                success: false,
                message: 'VendorId, amount, and type are required'
            });
        }

        if (type !== 'receive_goods' && type !== 'make_payment') {
            return res.status(400).json({
                success: false,
                message: 'Type must be either "receive_goods" or "make_payment"'
            });
        }

        if (type === 'receive_goods' && (!goodsName || goodsName.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'Goods name is required when receiving goods'
            });
        }

        // Verify vendor exists
        const vendorExists = await Vendor.findById(vendorId);
        if (!vendorExists) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        const transaction = new VendorTransaction({
            vendor: vendorId,
            amount: Number(amount),
            type,
            goodsName: type === 'receive_goods' ? goodsName.trim() : '',
            date: date || new Date()
        });

        await transaction.save();
        logger.info(`Vendor ledger entry added of type ${type} for vendor: ${vendorExists.name}. Amount: ${amount}`);

        return res.status(201).json({
            success: true,
            message: 'Vendor transaction recorded successfully',
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

// Get ledger/transactions for a particular vendor
exports.getVendorTransactions = async (req, res) => {
    try {
        const { vendorId } = req.params;

        // Verify vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Fetch all transactions sorted by date
        const transactions = await VendorTransaction.find({ vendor: vendorId }).sort({ date: 1 });

        // Calculate balances
        let totalGoodsValue = 0; // we received goods from vendor (we owe them)
        let totalPaid = 0;       // we paid to vendor (reduces what we owe)

        transactions.forEach(t => {
            if (t.type === 'receive_goods') {
                totalGoodsValue += t.amount;
            } else if (t.type === 'make_payment') {
                totalPaid += t.amount;
            }
        });

        const netBalance = totalGoodsValue - totalPaid;

        return res.status(200).json({
            success: true,
            vendor: {
                id: vendor._id,
                name: vendor.name,
                businessName: vendor.businessName,
                mobile: vendor.mobile
            },
            summary: {
                totalGoodsValue,
                totalPaid,
                netBalance,
                status: netBalance > 0 ? 'We owe vendor' : netBalance < 0 ? 'Vendor owes us (overpaid)' : 'Settled'
            },
            count: transactions.length,
            transactions
        });
    } catch (error) {
        logger.error(`Error in getVendorTransactions: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching vendor ledger details',
            error: error.message
        });
    }
};

// Update/Edit Transaction
exports.updateTransaction = async (req, res) => {
    try {
        const { amount, type, goodsName, date, vendorId } = req.body;

        let transaction = await VendorTransaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // If vendor is changing, verify new vendor exists
        if (vendorId && vendorId !== transaction.vendor.toString()) {
            const vendorExists = await Vendor.findById(vendorId);
            if (!vendorExists) {
                return res.status(404).json({
                    success: false,
                    message: 'New vendor not found'
                });
            }
            transaction.vendor = vendorId;
        }

        // Check types & validation
        const finalType = type !== undefined ? type : transaction.type;
        
        if (type !== undefined) {
            if (type !== 'receive_goods' && type !== 'make_payment') {
                return res.status(400).json({
                    success: false,
                    message: 'Type must be either "receive_goods" or "make_payment"'
                });
            }
            transaction.type = type;
        }

        if (amount !== undefined) {
            transaction.amount = Number(amount);
        }

        if (finalType === 'receive_goods') {
            const finalGoodsName = goodsName !== undefined ? goodsName : transaction.goodsName;
            if (!finalGoodsName || finalGoodsName.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Goods name is required when receiving goods'
                });
            }
            transaction.goodsName = finalGoodsName.trim();
        } else {
            // Clear goodsName if transaction type is make_payment
            transaction.goodsName = '';
        }

        if (date !== undefined) {
            transaction.date = date;
        }

        await transaction.save();
        logger.info(`Vendor Transaction ID ${transaction._id} updated successfully`);

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
        const transaction = await VendorTransaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        await VendorTransaction.deleteOne({ _id: req.params.id });
        logger.info(`Vendor Transaction ID ${transaction._id} deleted successfully`);

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
