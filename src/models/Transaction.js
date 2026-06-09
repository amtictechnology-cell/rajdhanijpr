const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer reference is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    type: {
        type: String,
        required: [true, 'Transaction type is required'],
        enum: {
            values: ['gave', 'took'],
            message: 'Type must be either "gave" or "took"'
        }
    },
    date: {
        type: Date,
        required: [true, 'Transaction date is required'],
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema);
