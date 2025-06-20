const express = require('express');
const router = express.Router();

// Import shared users array from dedicated module
const users = require('../models/users');

/**
 * Handle user profile request with userId parameter
 */
const handleUserProfileWithId = (req, res, next) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return next();
  }
  
  // Find the user with the given user_id
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
};

/**
 * Handle request for all user profiles
 */
const handleAllProfiles = (req, res) => {
  res.json({
    status: 'success',
    message: 'All user profiles retrieved successfully',
    users: users,
    count: users.length,
    timestamp: new Date().toISOString()
  });
};

// Routes
router.get('/profile', handleUserProfileWithId);
router.get('/allUsers', handleAllProfiles);

module.exports = router;
