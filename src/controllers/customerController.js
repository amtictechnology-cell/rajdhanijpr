const Customer = require('../models/Customer');
const logger = require('../utils/logger');

// Create a new Customer
exports.createCustomer = async (req, res) => {
    try {
        const { name, mobileNo, email, billingAddress, gstNo, location1, location2 } = req.body;

        if (!name || !mobileNo || !email || !billingAddress) {
            return res.status(400).json({
                success: false,
                message: 'Name, mobileNo, email, and billingAddress are required'
            });
        }

        const customer = new Customer({
            name,
            mobileNo,
            email,
            billingAddress,
            gstNo,
            location1,
            location2
        });

        await customer.save();
        logger.info(`Customer created: ${customer.name} (${customer.mobileNo})`);

        return res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            customer
        });
    } catch (error) {
        logger.error(`Error in createCustomer: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during customer creation',
            error: error.message
        });
    }
};

// Get All Customers
exports.getCustomers = async (req, res) => {
    try {
        // Option to filter/search by name or mobileNo
        const { search } = req.query;
        let query = {};
        
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { mobileNo: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const customers = await Customer.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });
    } catch (error) {
        logger.error(`Error in getCustomers: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching customers',
            error: error.message
        });
    }
};

// Get Single Customer by ID
exports.getCustomerById = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        return res.status(200).json({
            success: true,
            customer
        });
    } catch (error) {
        logger.error(`Error in getCustomerById: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching customer details',
            error: error.message
        });
    }
};

// Update/Edit Customer
exports.updateCustomer = async (req, res) => {
    try {
        const { name, mobileNo, email, billingAddress, gstNo, location1, location2 } = req.body;

        let customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Update fields if provided
        if (name !== undefined) customer.name = name;
        if (mobileNo !== undefined) customer.mobileNo = mobileNo;
        if (email !== undefined) customer.email = email;
        if (billingAddress !== undefined) customer.billingAddress = billingAddress;
        if (gstNo !== undefined) customer.gstNo = gstNo;
        if (location1 !== undefined) customer.location1 = location1;
        if (location2 !== undefined) customer.location2 = location2;

        await customer.save();
        logger.info(`Customer updated: ${customer.name}`);

        return res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            customer
        });
    } catch (error) {
        logger.error(`Error in updateCustomer: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during customer update',
            error: error.message
        });
    }
};

// Delete Customer
exports.deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        await Customer.deleteOne({ _id: req.params.id });
        logger.info(`Customer deleted: ${customer.name}`);

        return res.status(200).json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        logger.error(`Error in deleteCustomer: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during customer deletion',
            error: error.message
        });
    }
};
