// Import shared users array from dedicated module
const users = require('../models/users');

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
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: user_id and name are required'
      });
    }
    
    // Validate that role is an array of strings
    if (!role || !Array.isArray(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Role must be provided as an array of strings'
      });
    }
    
    // Validate each role is a string
    if (!role.every(r => typeof r === 'string')) {
      return res.status(400).json({
        status: 'error',
        message: 'Each role must be a string'
      });
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
    return res.status(200).json({
      status: 'success',
      message: 'User authenticated successfully',
      userData: newUser
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'production' ? {} : { message: error.message }
    });
  }
};

module.exports = {
  authenticate
};
