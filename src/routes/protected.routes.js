const express = require('express');
const router = express.Router();

// Import shared users array from dedicated module
const users = require('../models/users');

/**
 * @route   GET /api/users/profile?userId=123456
 * @desc    Get user profile data by userId query parameter
 * @access  Public
 */
router.get('/profile', (req, res, next) => {
  const userId = req.query.userId;
  
  // If userId is provided, return specific user
  if (userId) {
    // Find the user with the given user_id from our in-memory store
    const user = users.find(u => u.user_id === userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: `User with ID ${userId} not found`
      });
    }
    
    return res.json({
      status: 'success',
      message: 'User profile retrieved successfully',
      userData: user,
      timestamp: new Date().toISOString()
    });
  }
  
  // If no userId provided, continue to the next middleware
  next();
});

/**
 * @route   GET /api/users/profile
 * @desc    Get all user profiles
 * @access  Public
 */
router.get('/profile', (req, res) => {
  res.json({
    status: 'success',
    message: 'All user profiles retrieved successfully',
    userData: users,
    count: users.length,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
