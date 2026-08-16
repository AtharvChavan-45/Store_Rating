const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  addUser,
  addStore,
  getUsers,
  getStores,
  getUnassignedStoreOwners
} = require('../controllers/admin.controller');
const { authenticate, verifyAdmin } = require('../middlewares/auth');

// Apply admin access check to all routes in this router
router.use(authenticate);
router.use(verifyAdmin);

router.get('/stats', getDashboardStats);
router.post('/users', addUser);
router.post('/stores', addStore);
router.get('/users', getUsers);
router.get('/stores', getStores);
router.get('/unassigned-owners', getUnassignedStoreOwners);

module.exports = router;
