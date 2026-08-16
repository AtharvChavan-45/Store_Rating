const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');

// Regex for standard email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper validation functions
const validateName = (name) => {
  return name && name.trim().length >= 20 && name.trim().length <= 60;
};

const validateAddress = (address) => {
  return address && address.trim().length > 0 && address.trim().length <= 400;
};

const validatePassword = (password) => {
  if (!password || password.length < 8 || password.length > 16) {
    return false;
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  return hasUppercase && hasSpecial;
};

// Signup Controller (Only for Normal Users/Customers)
const signup = async (req, res, next) => {
  try {
    const { name, email, password, address, role } = req.body;

    // 1. Form Validations
    if (!validateName(name)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 20 and 60 characters long.'
      });
    }

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!validateAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Address is required and must not exceed 400 characters.'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8-16 characters and contain at least one uppercase letter and one special character.'
      });
    }

    // Determine the role to assign (default to 'user')
    const finalRole = (role && ['admin', 'user', 'store_owner'].includes(role)) ? role : 'user';

    // 2. Check if Email Already Exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered.'
      });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword, address.trim(), finalRole]
    );

    const roleLabel = finalRole === 'store_owner' ? 'Store Owner' : finalRole === 'admin' ? 'Admin' : 'Customer';
    return res.status(201).json({
      success: true,
      message: `${roleLabel} account created successfully. Please login to continue.`,
      userId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// Login Controller (Single login system checking role)
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and role.'
      });
    }

    // Fetch user with matching email and role
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND role = ?',
      [email.trim().toLowerCase(), role]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: `Invalid credentials or incorrect role for this email.`
      });
    }

    const user = users[0];

    // Verify hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or incorrect role for this email.'
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'default_local_jwt_secret_key_12345',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address
      }
    });
  } catch (error) {
    next(error);
  }
};

// Password Update Controller (Available for logged-in users)
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current password and new password are required.'
      });
    }

    // Fetch full user record (since req.user lacks password)
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
    const user = users[0];

    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Validate new password against complexity requirements
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be 8-16 characters and contain at least one uppercase letter and one special character.'
      });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  updatePassword
};
