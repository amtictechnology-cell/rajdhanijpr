const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all billing routes with authentication
router.use(authMiddleware);

// POST - Create bill
router.post('/', billController.createBill);

// GET - Read all bills (or filter by customerId)
router.get('/', billController.getBills);

// GET - Read single bill
router.get('/:id', billController.getBillById);

// PUT - Update bill
router.put('/:id', billController.updateBill);

// DELETE - Delete bill
router.delete('/:id', billController.deleteBill);

module.exports = router;
