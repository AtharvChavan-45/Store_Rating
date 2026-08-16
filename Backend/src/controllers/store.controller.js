const { pool } = require('../db/connection');

// Get all stores with ratings details, tailored for the logged-in customer
const getStoresForCustomer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, sortBy, order } = req.query;

    let query = `
      SELECT 
        s.id, s.name, s.email, s.address,
        AVG(r.rating) as average_rating,
        COUNT(r.id) as total_ratings,
        MAX(CASE WHEN r.user_id = ? THEN r.rating ELSE NULL END) as user_rating
      FROM stores s
      LEFT JOIN ratings r ON r.store_id = s.id
    `;

    const queryParams = [userId];
    const conditions = [];

    // Filter by name or address if search parameter is provided
    if (search && search.trim() !== '') {
      conditions.push('(s.name LIKE ? OR s.address LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY s.id';

    // Safe sorting
    const allowedSortFields = ['name', 'address', 'rating'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const sortOrder = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (sortField === 'rating') {
      query += ` ORDER BY average_rating ${sortOrder}`;
    } else {
      query += ` ORDER BY s.${sortField} ${sortOrder}`;
    }

    const [storesList] = await pool.query(query, queryParams);

    const formattedStores = storesList.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      address: s.address,
      rating: s.average_rating ? parseFloat(parseFloat(s.average_rating).toFixed(2)) : 0,
      totalRatings: s.total_ratings,
      userRating: s.user_rating || null
    }));

    return res.status(200).json({
      success: true,
      stores: formattedStores
    });
  } catch (error) {
    next(error);
  }
};

// Store Owner Dashboard stats and rater details
const getStoreOwnerDashboard = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { sortBy, order } = req.query;

    // 1. Fetch store owned by this user
    const [stores] = await pool.query(
      'SELECT id, name, address, email FROM stores WHERE owner_id = ?',
      [ownerId]
    );

    if (stores.length === 0) {
      return res.status(200).json({
        success: true,
        hasStore: false,
        message: 'No store is currently associated with this store owner account.'
      });
    }

    const store = stores[0];

    // 2. Fetch overall stats (average rating)
    const [[{ averageRating, totalRatings }]] = await pool.query(
      'SELECT AVG(rating) as averageRating, COUNT(*) as totalRatings FROM ratings WHERE store_id = ?',
      [store.id]
    );

    // 3. Fetch list of customers who rated, including sorting
    let ratingsQuery = `
      SELECT 
        u.name as customer_name, u.email as customer_email, u.address as customer_address,
        r.rating, r.updatedAt
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
    `;

    // Safe sorting
    const allowedSortFields = ['name', 'email', 'rating', 'date'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const sortOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'; // Default to newest first

    if (sortField === 'name') {
      ratingsQuery += ` ORDER BY u.name ${sortOrder}`;
    } else if (sortField === 'email') {
      ratingsQuery += ` ORDER BY u.email ${sortOrder}`;
    } else if (sortField === 'rating') {
      ratingsQuery += ` ORDER BY r.rating ${sortOrder}`;
    } else {
      ratingsQuery += ` ORDER BY r.updatedAt ${sortOrder}`;
    }

    const [raters] = await pool.query(ratingsQuery, [store.id]);

    return res.status(200).json({
      success: true,
      hasStore: true,
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        averageRating: averageRating ? parseFloat(parseFloat(averageRating).toFixed(2)) : 0,
        totalRatings: totalRatings || 0
      },
      ratings: raters.map(r => ({
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        customerAddress: r.customer_address,
        rating: r.rating,
        date: r.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStoresForCustomer,
  getStoreOwnerDashboard
};
