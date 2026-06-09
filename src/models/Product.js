const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    },
    priceUnit: {
        type: String,
        required: [true, 'Price unit is required'],
        trim: true
    },
    productDescription: {
        type: String,
        trim: true,
        default: ''
    },
    image: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
