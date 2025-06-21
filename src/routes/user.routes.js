const express = require('express');
const router = express.Router();

const db = require('../utils/db');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');
const { requireRoles } = require('../middleware/role.middleware');
const authMiddleware = require('../middleware/auth.middleware');

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

/**
 * Handle updating a user profile
 */
const updateUserProfile = async (req, res) => {
  try {
    // Get the user ID from the authenticated request
    const userId = req.userId;
    
    if (!userId || userId === 'anonymous') {
      return sendError(
        res,
        'Authentication required. Valid X-User-ID header is needed.', 
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    
    const { name, contact_number, dob, gender } = req.body;
    
    // Create update object with only the fields that are provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (contact_number !== undefined) updateData.contact_number = contact_number;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    
    // If no valid fields to update
    if (Object.keys(updateData).length === 0) {
      return sendError(
        res,
        'No valid fields to update. Provide at least one of: name, contact_number, dob, gender',
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Find the user to check if it exists
    const users = await db.fetchData(USERS_TABLE, { user_id: `eq.${userId}` });
    
    if (!users || users.length === 0) {
      return sendError(
        res,
        `User with ID ${userId} not found`,
        HTTP_STATUS.NOT_FOUND
      );
    }
    
    // Update the user in the database
    const updatedUser = await db.updateData(USERS_TABLE, updateData, { user_id: userId });
    
    // Return success response
    return sendSuccess(
      res,
      'User profile updated successfully',
      updatedUser
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    return sendError(
      res,
      'Failed to update user profile',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

// Define roles for different routes
const USER_ROLES = {
  VIEW_PROFILE: ['user', 'admin', 'teacher', 'student'],
  VIEW_ALL_PROFILES: ['admin', 'teacher'],
  UPDATE_PROFILE: ['user', 'admin', 'teacher', 'student']
};

// Routes with role-based access control
router.get('/profile', requireRoles(USER_ROLES.VIEW_PROFILE), handleUserProfileWithId);
router.get('/allUsers', requireRoles(USER_ROLES.VIEW_ALL_PROFILES), handleAllProfiles);

// Update user profile route - uses both auth middleware and role middleware
router.put('/updateProfile', authMiddleware, requireRoles(USER_ROLES.UPDATE_PROFILE), updateUserProfile);

module.exports = router;
