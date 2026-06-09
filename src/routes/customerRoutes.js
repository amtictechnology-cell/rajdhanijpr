const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all customer routes with authentication
router.use(authMiddleware);

// POST - Create customer
router.post('/', customerController.createCustomer);

// GET - Read all customers
router.get('/', customerController.getCustomers);

// GET - Read single customer details
router.get('/:id', customerController.getCustomerById);

// PUT - Update customer
router.put('/:id', customerController.updateCustomer);

// DELETE - Delete customer
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
