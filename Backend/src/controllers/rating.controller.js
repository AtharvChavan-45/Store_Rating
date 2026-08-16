const { pool } = require('../db/connection');

// Submit a new rating (1 to 5) for a store
const submitRating = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { store_id, rating } = req.body;

    // 1. Validation
    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.'
      });
    }

    // 2. Check if the store exists
    const [stores] = await pool.query('SELECT id FROM stores WHERE id = ?', [store_id]);
    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found.'
      });
    }

    // 3. Check if user already submitted a rating for this store
    const [existing] = await pool.query(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [userId, store_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this store. Please modify your rating instead.'
      });
    }

    // 4. Insert rating
    await pool.query(
      'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
      [userId, store_id, ratingVal]
    );

    return res.status(201).json({
      success: true,
      message: 'Rating submitted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Modify an existing rating (1 to 5) for a store
const modifyRating = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { store_id, rating } = req.body;

    // 1. Validation
    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    if (!store_id) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required.'
      });
    }

    // 2. Check if rating exists
    const [existing] = await pool.query(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [userId, store_id]
    );

    if (existing.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No rating found to modify for this store.'
      });
    }

    // 3. Update rating
    await pool.query(
      'UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?',
      [ratingVal, userId, store_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Rating modified successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitRating,
  modifyRating
};
