const Vendor = require('../models/Vendor');
const VendorTransaction = require('../models/VendorTransaction');
const logger = require('../utils/logger');

// Create a new Vendor
exports.createVendor = async (req, res) => {
    try {
        const { name, mobile, location, email, businessName } = req.body;

        if (!name || !mobile || !location || !email || !businessName) {
            return res.status(400).json({
                success: false,
                message: 'Name, mobile, location, email, and businessName are required'
            });
        }

        const vendor = new Vendor({
            name,
            mobile,
            location,
            email,
            businessName
        });

        await vendor.save();
        logger.info(`Vendor created: ${vendor.name} (${vendor.businessName})`);

        return res.status(201).json({
            success: true,
            message: 'Vendor created successfully',
            vendor
        });
    } catch (error) {
        logger.error(`Error in createVendor: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during vendor creation',
            error: error.message
        });
    }
};

// Get All Vendors
exports.getVendors = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { businessName: { $regex: search, $options: 'i' } },
                    { mobile: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const vendors = await Vendor.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: vendors.length,
            vendors
        });
    } catch (error) {
        logger.error(`Error in getVendors: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching vendors',
            error: error.message
        });
    }
};

// Get Single Vendor by ID
exports.getVendorById = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        return res.status(200).json({
            success: true,
            vendor
        });
    } catch (error) {
        logger.error(`Error in getVendorById: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching vendor details',
            error: error.message
        });
    }
};

// Update/Edit Vendor
exports.updateVendor = async (req, res) => {
    try {
        const { name, mobile, location, email, businessName } = req.body;

        let vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Update fields if provided
        if (name !== undefined) vendor.name = name;
        if (mobile !== undefined) vendor.mobile = mobile;
        if (location !== undefined) vendor.location = location;
        if (email !== undefined) vendor.email = email;
        if (businessName !== undefined) vendor.businessName = businessName;

        await vendor.save();
        logger.info(`Vendor updated: ${vendor.name}`);

        return res.status(200).json({
            success: true,
            message: 'Vendor updated successfully',
            vendor
        });
    } catch (error) {
        logger.error(`Error in updateVendor: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during vendor update',
            error: error.message
        });
    }
};

// Delete Vendor (and all associated transactions cascadingly)
exports.deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Cascade delete transactions
        const deletedTransactions = await VendorTransaction.deleteMany({ vendor: req.params.id });
        logger.info(`Deleted ${deletedTransactions.deletedCount} transactions for vendor ID: ${req.params.id}`);

        await Vendor.deleteOne({ _id: req.params.id });
        logger.info(`Vendor deleted: ${vendor.name}`);

        return res.status(200).json({
            success: true,
            message: 'Vendor and associated ledger transactions deleted successfully'
        });
    } catch (error) {
        logger.error(`Error in deleteVendor: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during vendor deletion',
            error: error.message
        });
    }
};
