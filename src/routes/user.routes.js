const express = require('express');
const router = express.Router();

// Import shared users array from dedicated module
const users = require('../models/users');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');
const { requireRoles } = require('../middleware/role.middleware');

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

// Define roles for different routes
const USER_ROLES = {
  VIEW_PROFILE: ['user', 'admin', 'teacher', 'student'],
  VIEW_ALL_PROFILES: ['admin', 'teacher']
};

// Routes with role-based access control
router.get('/profile', requireRoles(USER_ROLES.VIEW_PROFILE), handleUserProfileWithId);
router.get('/allUsers', requireRoles(USER_ROLES.VIEW_ALL_PROFILES), handleAllProfiles);

module.exports = router;
