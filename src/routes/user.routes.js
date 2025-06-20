const express = require('express');
const router = express.Router();

const db = require('../utils/db');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');
const { requireRoles } = require('../middleware/role.middleware');

// Table name for users in Supabase
const USERS_TABLE = 'users';

/**
 * Handle user profile request with userId parameter
 */
const handleUserProfileWithId = async (req, res, next) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return next();
  }
  
  try {
    // Find the user with the given user_id from Supabase
    const users = await db.fetchData(USERS_TABLE, { 
      user_id: `eq.${userId}` 
    });
    
    if (!users || users.length === 0) {
      return sendError(
        res,
        `User with ID ${userId} not found`, 
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    return sendSuccess(
      res,
      'User profile retrieved successfully',
      users[0]
    );
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return sendError(
      res, 
      'Failed to retrieve user profile', 
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

/**
 * Handle request for all user profiles
 */
const handleAllProfiles = async (req, res) => {
  try {
    // Get all users from Supabase
    const users = await db.fetchData(USERS_TABLE);
    
    const responseData = {
      profiles: users,
      count: users.length
    };
    
    return sendSuccess(
      res,
      'All user profiles retrieved successfully',
      responseData
    );
  } catch (error) {
    console.error('Error fetching all profiles:', error);
    return sendError(
      res, 
      'Failed to retrieve user profiles', 
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
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
