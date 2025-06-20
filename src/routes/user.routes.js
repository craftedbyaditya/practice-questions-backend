const express = require('express');
const router = express.Router();

// Import shared users array from dedicated module
const users = require('../models/users');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');

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
    return sendError(
      res,
      `User with ID ${userId} not found`, 
      HTTP_STATUS.NOT_FOUND
    );
  }
  
  return sendSuccess(
    res,
    'User profile retrieved successfully',
    user
  );
};

/**
 * Handle request for all user profiles
 */
const handleAllProfiles = (req, res) => {
  const responseData = {
    profiles: users,
    count: users.length
  };
  
  return sendSuccess(
    res,
    'All user profiles retrieved successfully',
    responseData
  );
};

// Routes
router.get('/profile', handleUserProfileWithId);
router.get('/allUsers', handleAllProfiles);

module.exports = router;
