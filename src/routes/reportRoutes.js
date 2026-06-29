const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all report routes with authentication
router.use(authMiddleware);

// GET - Get summary list of all customers and their outstanding dues
router.get('/customer-summary', reportController.getCustomerSummaries);

// GET - Get detailed financial summary for a specific customer
router.get('/customer-summary/:customerId', reportController.getCustomerSummaryById);

module.exports = router;
