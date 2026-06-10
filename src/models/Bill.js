const mongoose = require('mongoose');

const BillItemSchema = new mongoose.Schema({
    itemDescription: {
        type: String,
        required: [true, 'Item or service name/description is required'],
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        default: 1
    },
    width: {
        type: Number,
        required: [true, 'Width size is required'],
        min: [0, 'Width must be positive'],
        default: 1
    },
    height: {
        type: Number,
        required: [true, 'Height size is required'],
        min: [0, 'Height must be positive'],
        default: 1
    },
    rate: {
        type: Number,
        required: [true, 'Rate is required'],
        min: [0, 'Rate must be positive']
    },
    amount: {
        type: Number,
        required: true
    }
});

const BillSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer reference is required']
    },
    items: [BillItemSchema],
    paymentMethod: {
        type: String,
        required: [true, 'Payment method is required'],
        trim: true,
        default: 'Cash'
    },
    transportCharge: {
        type: Number,
        default: 0,
        min: [0, 'Transport charge must be positive']
    },
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    billDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Bill', BillSchema);
