const express = require('express');
const router = express.Router();
const vendorTransactionController = require('../controllers/vendorTransactionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all vendor transaction routes with authentication
router.use(authMiddleware);

// POST - Add transaction (receive_goods / make_payment)
router.post('/', vendorTransactionController.addTransaction);

// GET - Get vendor statement & list of transactions
router.get('/vendor/:vendorId', vendorTransactionController.getVendorTransactions);

// PUT - Update transaction
router.put('/:id', vendorTransactionController.updateTransaction);

// DELETE - Delete transaction
router.delete('/:id', vendorTransactionController.deleteTransaction);

module.exports = router;
