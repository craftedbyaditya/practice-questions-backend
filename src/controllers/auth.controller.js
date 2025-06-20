// Import shared users array from dedicated module
const users = require('../models/users');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');

/**
 * Authenticate a user with expanded profile data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const authenticate = (req, res) => {
  try {
    const { user_id, name, role, login_platform, mobile_no, gender, dob } = req.body;

    // Validate required fields
    if (!user_id || !name) {
      return sendError(
        res, 
        'Missing required fields: user_id and name are required', 
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Validate that role is an array of strings
    if (!role || !Array.isArray(role)) {
      return sendError(
        res, 
        'Role must be provided as an array of strings', 
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Validate each role is a string
    if (!role.every(r => typeof r === 'string')) {
      return sendError(
        res, 
        'Each role must be a string', 
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create user object with all provided fields
    const newUser = { 
      user_id, 
      name, 
      role,
      login_platform: login_platform || null,
      mobile_no: mobile_no || null,
      gender: gender || null,
      dob: dob || null
    };
    
    // Check if user already exists
    const existingUserIndex = users.findIndex(u => u.user_id === user_id);
    
    if (existingUserIndex >= 0) {
      // Update existing user
      users[existingUserIndex] = newUser;
    } else {
      // Add new user
      users.push(newUser);
    }

    // Return success response
    return sendSuccess(
      res,
      'User authenticated successfully',
      newUser,
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Authentication error:', error);
    return sendError(
      res,
      'Authentication failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error
    );
  }
};

module.exports = {
  authenticate
};
