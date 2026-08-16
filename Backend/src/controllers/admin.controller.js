const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const getDashboardStats = async (req, res, next) => {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
    const [[{ totalStores }]] = await pool.query('SELECT COUNT(*) as totalStores FROM stores');
    const [[{ totalRatings }]] = await pool.query('SELECT COUNT(*) as totalRatings FROM ratings');

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStores,
        totalRatings
      }
    });
  } catch (error) {
    next(error);
  }
};

const addUser = async (req, res, next) => {
  try {
    const { name, email, password, address, role } = req.body;

    if (!role || !['admin', 'user', 'store_owner'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either admin, user (normal), or store_owner.'
      });
    }

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

    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword, address.trim(), role]
    );

    return res.status(201).json({
      success: true,
      message: `${role.replace('_', ' ')} user created successfully.`,
      userId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

const addStore = async (req, res, next) => {
  try {
    const { name, email, address, owner_id } = req.body;

    if (!name || name.trim().length < 3 || name.trim().length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Store Name must be between 3 and 60 characters long.'
      });
    }

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address for the store.'
      });
    }

    if (!validateAddress(address)) {
      return res.status(400).json({
        success: false,
        message: 'Store Address is required and must not exceed 400 characters.'
      });
    }

    const [existingStores] = await pool.query('SELECT id FROM stores WHERE email = ?', [email]);
    if (existingStores.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Store email is already registered.'
      });
    }

    let ownerIdVal = null;
    if (owner_id) {
      ownerIdVal = parseInt(owner_id, 10);
      // Validate owner: must be a store_owner and not already own a store
      const [ownerCheck] = await pool.query(
        'SELECT role FROM users WHERE id = ?',
        [ownerIdVal]
      );

      if (ownerCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'The selected store owner does not exist.'
        });
      }

      if (ownerCheck[0].role !== 'store_owner') {
        return res.status(400).json({
          success: false,
          message: 'The selected user is not a Store Owner.'
        });
      }

      const [assignedCheck] = await pool.query(
        'SELECT id FROM stores WHERE owner_id = ?',
        [ownerIdVal]
      );

      if (assignedCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'The selected Store Owner is already assigned to another store.'
        });
      }
    }

    // Insert Store
    const [result] = await pool.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), address.trim(), ownerIdVal]
    );

    return res.status(201).json({
      success: true,
      message: 'Store registered successfully.',
      storeId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};


const getUsers = async (req, res, next) => {
  try {
    const { name, email, address, role, sortBy, order } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.address, u.role, u.createdAt,
        s.id as store_id, s.name as store_name,
        AVG(r.rating) as store_rating
      FROM users u
      LEFT JOIN stores s ON s.owner_id = u.id
      LEFT JOIN ratings r ON r.store_id = s.id
    `;

    const queryParams = [];
    const conditions = [];


    if (name) {
      conditions.push('u.name LIKE ?');
      queryParams.push(`%${name}%`);
    }
    if (email) {
      conditions.push('u.email LIKE ?');
      queryParams.push(`%${email}%`);
    }
    if (address) {
      conditions.push('u.address LIKE ?');
      queryParams.push(`%${address}%`);
    }
    if (role) {
      conditions.push('u.role = ?');
      queryParams.push(role);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY u.id';

  
    const allowedSortFields = ['name', 'email', 'address', 'role', 'createdAt', 'store_rating'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'u.name';
    const sortOrder = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (sortField === 'store_rating') {
      query += ` ORDER BY store_rating ${sortOrder}`;
    } else if (sortField === 'createdAt') {
      query += ` ORDER BY u.createdAt ${sortOrder}`;
    } else {
      query += ` ORDER BY u.${sortField} ${sortOrder}`;
    }

    const [usersList] = await pool.query(query, queryParams);

    const formattedUsers = usersList.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      address: u.address,
      role: u.role,
      createdAt: u.createdAt,
      store: u.store_id ? {
        id: u.store_id,
        name: u.store_name,
        rating: u.store_rating ? parseFloat(parseFloat(u.store_rating).toFixed(2)) : 0
      } : null
    }));

    return res.status(200).json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    next(error);
  }
};

const getStores = async (req, res, next) => {
  try {
    const { name, email, address, sortBy, order } = req.query;

    let query = `
      SELECT 
        s.id, s.name, s.email, s.address, s.createdAt,
        u.id as owner_id, u.name as owner_name, u.email as owner_email,
        AVG(r.rating) as average_rating,
        COUNT(r.id) as total_ratings
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON r.store_id = s.id
    `;

    const queryParams = [];
    const conditions = [];

    // Filters
    if (name) {
      conditions.push('s.name LIKE ?');
      queryParams.push(`%${name}%`);
    }
    if (email) {
      conditions.push('s.email LIKE ?');
      queryParams.push(`%${email}%`);
    }
    if (address) {
      conditions.push('s.address LIKE ?');
      queryParams.push(`%${address}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY s.id';

    const allowedSortFields = ['name', 'email', 'address', 'rating', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 's.name';
    const sortOrder = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (sortField === 'rating') {
      query += ` ORDER BY average_rating ${sortOrder}`;
    } else if (sortField === 'createdAt') {
      query += ` ORDER BY s.createdAt ${sortOrder}`;
    } else {
      query += ` ORDER BY s.${sortField} ${sortOrder}`;
    }

    const [storesList] = await pool.query(query, queryParams);

    const formattedStores = storesList.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      createdAt: s.createdAt,
      owner: s.owner_id ? {
        id: s.owner_id,
        name: s.owner_name,
        email: s.owner_email
      } : null,
      rating: s.average_rating ? parseFloat(parseFloat(s.average_rating).toFixed(2)) : 0,
      totalRatings: s.total_ratings
    }));

    return res.status(200).json({
      success: true,
      stores: formattedStores
    });
  } catch (error) {
    next(error);
  }
};

const getUnassignedStoreOwners = async (req, res, next) => {
  try {
    const query = `
      SELECT id, name, email FROM users 
      WHERE role = 'store_owner' 
      AND id NOT IN (SELECT owner_id FROM stores WHERE owner_id IS NOT NULL)
      ORDER BY name ASC
    `;
    const [owners] = await pool.query(query);

    return res.status(200).json({
      success: true,
      owners
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  addUser,
  addStore,
  getUsers,
  getStores,
  getUnassignedStoreOwners
};
