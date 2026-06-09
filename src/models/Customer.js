const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    mobileNo: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email address is required'],
        trim: true
    },
    billingAddress: {
        type: String,
        required: [true, 'Billing address is required'],
        trim: true
    },
    gstNo: {
        type: String,
        trim: true,
        default: ''
    },
    location1: {
        type: String,
        trim: true,
        default: ''
    },
    location2: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema);
