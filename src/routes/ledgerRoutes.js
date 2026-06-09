const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all ledger routes with authentication
router.use(authMiddleware);

// POST - Add ledger entry/transaction (gave/took)
router.post('/', ledgerController.addTransaction);

// GET - Get customer ledger & summary statement
router.get('/customer/:customerId', ledgerController.getCustomerLedger);

// PUT - Update ledger entry
router.put('/:id', ledgerController.updateTransaction);

// DELETE - Delete ledger entry
router.delete('/:id', ledgerController.deleteTransaction);

module.exports = router;
