const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_local_jwt_secret_key_12345');

    // Fetch fresh user data from the database to check if user still exists
    const [users] = await pool.query(
      'SELECT id, name, email, role, address FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found. Invalid token.' });
    }

    // Attach user information to the request
    req.user = users[0];
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

// Middleware to restrict access to System Administrators only
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
};

// Middleware to restrict access to Store Owners only
const verifyStoreOwner = (req, res, next) => {
  if (req.user && req.user.role === 'store_owner') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Store Owner privileges required.' });
  }
};

// Middleware to restrict access to Normal Users (Customers) only
const verifyNormalUser = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Normal User privileges required.' });
  }
};

module.exports = {
  authenticate,
  verifyAdmin,
  verifyStoreOwner,
  verifyNormalUser
};
