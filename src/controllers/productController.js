const Product = require('../models/Product');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Helper to normalize paths to forward slashes for URL routing consistency
const normalizePath = (filePath) => {
    return filePath ? filePath.replace(/\\/g, '/') : '';
};

// Helper to delete an image file safely
const deleteImageFile = (imagePath) => {
    if (imagePath) {
        const fullPath = path.join(__dirname, '../../', imagePath);
        fs.unlink(fullPath, (err) => {
            if (err) {
                logger.error(`Failed to delete image file at ${fullPath}: ${err.message}`);
            } else {
                logger.info(`Successfully deleted image file at ${fullPath}`);
            }
        });
    }
};

// Create a new Product
exports.createProduct = async (req, res) => {
    try {
        const { productName, price, priceUnit, productDescription } = req.body;

        if (!productName || !price || !priceUnit) {
            // If validation fails and an image was uploaded, delete it to avoid orphan files
            if (req.file) {
                deleteImageFile(normalizePath(req.file.path));
            }
            return res.status(400).json({
                success: false,
                message: 'ProductName, price, and priceUnit are required'
            });
        }

        let image = '';
        if (req.file) {
            image = normalizePath(req.file.path);
        }

        const product = new Product({
            productName,
            price: Number(price),
            priceUnit,
            productDescription,
            image
        });

        await product.save();
        logger.info(`Product created: ${product.productName}`);

        return res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        // Cleanup uploaded file on error
        if (req.file) {
            deleteImageFile(normalizePath(req.file.path));
        }
        logger.error(`Error in createProduct: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during product creation',
            error: error.message
        });
    }
};

// Get All Products
exports.getProducts = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query = { productName: { $regex: search, $options: 'i' } };
        }

        const products = await Product.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        logger.error(`Error in getProducts: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching products',
            error: error.message
        });
    }
};

// Get Single Product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        return res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        logger.error(`Error in getProductById: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching product details',
            error: error.message
        });
    }
};

// Update/Edit Product
exports.updateProduct = async (req, res) => {
    try {
        const { productName, price, priceUnit, productDescription } = req.body;

        let product = await Product.findById(req.params.id);

        if (!product) {
            // Delete new file if uploaded but product not found
            if (req.file) {
                deleteImageFile(normalizePath(req.file.path));
            }
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Update basic text fields
        if (productName !== undefined) product.productName = productName;
        if (price !== undefined) product.price = Number(price);
        if (priceUnit !== undefined) product.priceUnit = priceUnit;
        if (productDescription !== undefined) product.productDescription = productDescription;

        // Update image if new file is uploaded
        if (req.file) {
            // Delete the old image file if it exists
            if (product.image) {
                deleteImageFile(product.image);
            }
            // Save new normalized image path
            product.image = normalizePath(req.file.path);
        }

        await product.save();
        logger.info(`Product updated: ${product.productName}`);

        return res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        if (req.file) {
            deleteImageFile(normalizePath(req.file.path));
        }
        logger.error(`Error in updateProduct: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during product update',
            error: error.message
        });
    }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete the associated image file from disk
        if (product.image) {
            deleteImageFile(product.image);
        }

        await Product.deleteOne({ _id: req.params.id });
        logger.info(`Product deleted: ${product.productName}`);

        return res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        logger.error(`Error in deleteProduct: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during product deletion',
            error: error.message
        });
    }
};
