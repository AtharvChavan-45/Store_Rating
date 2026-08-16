const express = require('express');
const router = express.Router();
const { signup, login, updatePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');

// Public endpoints
router.post('/signup', signup);
router.post('/login', login);

// Protected endpoints
router.put('/update-password', authenticate, updatePassword);

module.exports = router;
