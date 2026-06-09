const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const productRoutes = require('./productRoutes');
const billRoutes = require('./billRoutes');
const ledgerRoutes = require('./ledgerRoutes');

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/bills', billRoutes);
router.use('/ledger', ledgerRoutes);

module.exports = router;
