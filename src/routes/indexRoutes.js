const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const productRoutes = require('./productRoutes');
const billRoutes = require('./billRoutes');
const ledgerRoutes = require('./ledgerRoutes');
const vendorRoutes = require('./vendorRoutes');
const vendorTransactionRoutes = require('./vendorTransactionRoutes');

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/bills', billRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/vendors', vendorRoutes);
router.use('/vendor-transactions', vendorTransactionRoutes);

module.exports = router;
