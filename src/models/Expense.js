const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    date: {
        type: Date,
        required: [true, 'Expense date is required'],
        default: Date.now
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Expense', ExpenseSchema);
