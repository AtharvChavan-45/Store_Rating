const express = require('express');
const router = express.Router();
const { submitRating, modifyRating } = require('../controllers/rating.controller');
const { authenticate, verifyNormalUser } = require('../middlewares/auth');

// All rating endpoints require user authentication and normal user (customer) role
router.use(authenticate);
router.use(verifyNormalUser);

router.post('/', submitRating);
router.put('/', modifyRating);

module.exports = router;
