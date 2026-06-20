const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const logger = require('../utils/logger');

// Create a new Bill
exports.createBill = async (req, res) => {
    try {
        const { customerId, items, paymentMethod, billDate, transportCharge } = req.body;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one item/service is required'
            });
        }

        // Verify customer exists
        const customerExists = await Customer.findById(customerId);
        if (!customerExists) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        let calculatedTotal = 0;
        const processedItems = items.map(item => {
            const quantity = Number(item.quantity) || 1;
            const width = item.width !== undefined ? Number(item.width) : 1;
            const height = item.height !== undefined ? Number(item.height) : 1;
            const rate = Number(item.rate) || 0;
            
            // Calculate amount: quantity * width * height * rate
            const amount = quantity * width * height * rate;
            calculatedTotal += amount;

            return {
                itemDescription: item.itemDescription || 'Print Service',
                quantity,
                width,
                height,
                rate,
                amount
            };
        });

        const charge = Number(transportCharge) || 0;

        const bill = new Bill({
            customer: customerId,
            items: processedItems,
            paymentMethod: paymentMethod || 'Cash',
            transportCharge: charge,
            totalAmount: calculatedTotal + charge,
            billDate: billDate || new Date()
        });

        await bill.save();
        logger.info(`Bill created successfully for customer: ${customerExists.name}, Total: ${bill.totalAmount}`);

        // Fetch populated bill to return
        const populatedBill = await Bill.findById(bill._id).populate('customer', 'name mobileNo email billingAddress gstNo location1 location2');

        // Automated PDF Invoice Generation & Email Attachment delivery
        let emailSentStatus = false;
        let pdfPath = '';
        try {
            const { generateInvoicePdf } = require('../utils/pdfGenerator');
            pdfPath = await generateInvoicePdf(populatedBill);

            if (populatedBill.customer && populatedBill.customer.email && populatedBill.customer.email.trim() !== '') {
                const { sendInvoiceEmail } = require('../utils/emailSender');
                await sendInvoiceEmail(
                    populatedBill.customer.email,
                    populatedBill.customer.name,
                    populatedBill._id,
                    pdfPath
                );
                emailSentStatus = true;
            } else {
                logger.warn(`No valid email address found for customer ${populatedBill.customer?.name}. Skipping email.`);
            }
        } catch (emailError) {
            logger.error(`Automated PDF/Email invoice failed for Bill ID ${populatedBill._id}: ${emailError.message}`);
        }

        return res.status(201).json({
            success: true,
            message: 'Bill created successfully',
            emailSent: emailSentStatus,
            invoicePdfPath: pdfPath || null,
            bill: populatedBill
        });
    } catch (error) {
        logger.error(`Error in createBill: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during bill creation',
            error: error.message
        });
    }
};

// Get All Bills
exports.getBills = async (req, res) => {
    try {
        const { customerId } = req.query;
        let query = {};

        if (customerId) {
            query.customer = customerId;
        }

        const bills = await Bill.find(query)
            .populate('customer', 'name mobileNo email billingAddress gstNo location1 location2')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: bills.length,
            bills
        });
    } catch (error) {
        logger.error(`Error in getBills: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching bills',
            error: error.message
        });
    }
};

// Get Single Bill by ID
exports.getBillById = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id)
            .populate('customer', 'name mobileNo email billingAddress gstNo location1 location2');

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        return res.status(200).json({
            success: true,
            bill
        });
    } catch (error) {
        logger.error(`Error in getBillById: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching bill details',
            error: error.message
        });
    }
};

// Update/Edit Bill
exports.updateBill = async (req, res) => {
    try {
        const { customerId, items, paymentMethod, billDate, transportCharge } = req.body;

        let bill = await Bill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        // If customer is changing, verify the new customer exists
        if (customerId && customerId !== bill.customer.toString()) {
            const customerExists = await Customer.findById(customerId);
            if (!customerExists) {
                return res.status(404).json({
                    success: false,
                    message: 'New customer not found'
                });
            }
            bill.customer = customerId;
        }

        if (paymentMethod !== undefined) bill.paymentMethod = paymentMethod;
        if (billDate !== undefined) bill.billDate = billDate;

        if (transportCharge !== undefined) {
            bill.transportCharge = Number(transportCharge) || 0;
        }

        // If items list is updated, recalculate amounts and total
        if (items && Array.isArray(items)) {
            let calculatedTotal = 0;
            const processedItems = items.map(item => {
                const quantity = Number(item.quantity) || 1;
                const width = item.width !== undefined ? Number(item.width) : 1;
                const height = item.height !== undefined ? Number(item.height) : 1;
                const rate = Number(item.rate) || 0;
                
                const amount = quantity * width * height * rate;
                calculatedTotal += amount;

                return {
                    itemDescription: item.itemDescription || 'Print Service',
                    quantity,
                    width,
                    height,
                    rate,
                    amount
                };
            });

            bill.items = processedItems;
            bill.totalAmount = calculatedTotal + bill.transportCharge;
        } else if (transportCharge !== undefined) {
            // Recalculate total if only transport charge changed
            const itemsTotal = bill.items.reduce((sum, item) => sum + item.amount, 0);
            bill.totalAmount = itemsTotal + bill.transportCharge;
        }

        await bill.save();
        logger.info(`Bill updated successfully: ID ${bill._id}`);

        const populatedBill = await Bill.findById(bill._id).populate('customer', 'name mobileNo email billingAddress gstNo location1 location2');

        return res.status(200).json({
            success: true,
            message: 'Bill updated successfully',
            bill: populatedBill
        });
    } catch (error) {
        logger.error(`Error in updateBill: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during bill update',
            error: error.message
        });
    }
};

// Delete Bill
exports.deleteBill = async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);

        if (!bill) {
            return res.status(404).json({
                success: false,
                message: 'Bill not found'
            });
        }

        await Bill.deleteOne({ _id: req.params.id });
        logger.info(`Bill deleted: ID ${bill._id}`);

        return res.status(200).json({
            success: true,
            message: 'Bill deleted successfully'
        });
    } catch (error) {
        logger.error(`Error in deleteBill: ${error.message}`);
        return res.status(500).json({
            success: false,
            message: 'Server error during bill deletion',
            error: error.message
        });
    }
};
