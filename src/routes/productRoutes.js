const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

// Protect all product routes with authentication
router.use(authMiddleware);

// POST - Create product (with image upload)
router.post('/', uploadMiddleware, productController.createProduct);

// GET - Read all products
router.get('/', productController.getProducts);

// GET - Read single product details
router.get('/:id', productController.getProductById);

// PUT - Update product (with optional image update)
router.put('/:id', uploadMiddleware, productController.updateProduct);

// DELETE - Delete product
router.delete('/:id', productController.deleteProduct);

module.exports = router;
