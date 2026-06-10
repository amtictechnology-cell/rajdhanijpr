const mongoose = require('mongoose');

const VendorTransactionSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: [true, 'Vendor reference is required']
    },
    type: {
        type: String,
        required: [true, 'Transaction type is required'],
        enum: {
            values: ['receive_goods', 'make_payment'],
            message: 'Type must be either "receive_goods" or "make_payment"'
        }
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    goodsName: {
        type: String,
        trim: true,
        // Optional, but required if type is receive_goods
        default: ''
    },
    date: {
        type: Date,
        required: [true, 'Transaction date is required'],
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('VendorTransaction', VendorTransactionSchema);
