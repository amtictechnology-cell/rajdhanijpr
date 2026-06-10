const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protect all vendor routes with authentication
router.use(authMiddleware);

// POST - Create vendor
router.post('/', vendorController.createVendor);

// GET - Read all vendors
router.get('/', vendorController.getVendors);

// GET - Read single vendor details
router.get('/:id', vendorController.getVendorById);

// PUT - Update vendor
router.put('/:id', vendorController.updateVendor);

// DELETE - Delete vendor
router.delete('/:id', vendorController.deleteVendor);

module.exports = router;
