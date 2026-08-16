const express = require('express');
const router = express.Router();
const { getStoresForCustomer, getStoreOwnerDashboard } = require('../controllers/store.controller');
const { authenticate, verifyNormalUser, verifyStoreOwner } = require('../middlewares/auth');

// Customer store list & search (Customer role required)
router.get('/customer', authenticate, verifyNormalUser, getStoresForCustomer);

// Store Owner dashboard details (Store Owner role required)
router.get('/owner', authenticate, verifyStoreOwner, getStoreOwnerDashboard);

module.exports = router;
