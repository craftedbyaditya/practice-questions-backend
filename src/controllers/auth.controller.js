const db = require('../utils/db');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/response');

// Table name for users in Supabase
const USERS_TABLE = 'users';

/**
 * Authenticate a user with expanded profile data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const authenticate = async (req, res) => {
  try {
    const { 
      user_id, // This will be used as auth_id in our table
      name, 
      role,
      email,
      contact_number,
      gender, 
      dob,
      profile_picture,
      is_anonymous = false,
      is_approved = false
    } = req.body;

    // Validate required fields
    if (!user_id) {
      return sendError(
        res, 
        'Missing required field: user_id is required', 
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Validate that role is an array of strings if provided
    if (role && !Array.isArray(role)) {
      return sendError(
        res, 
        'Role must be provided as an array of strings', 
        HTTP_STATUS.BAD_REQUEST
      );
    }
    
    // Validate each role is a string if provided
    if (role && !role.every(r => typeof r === 'string')) {
      return sendError(
        res, 
        'Each role must be a string', 
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create user object with all provided fields
    const userData = { 
      user_id, // Primary key is user_id now
      name, 
      email,
      contact_number,
      gender: gender || null,
      dob: dob || null,
      profile_picture: profile_picture || null,
      is_anonymous,
      is_approved,
      role
    };
    
    // Check if user already exists
    const existingUsers = await db.fetchData(USERS_TABLE, {
      user_id: `eq.${user_id}`,
      select: 'user_id'
    });
    
    let user;
    if (existingUsers && existingUsers.length > 0) {
      // Update existing user
      user = await db.updateData(USERS_TABLE, userData, { user_id });
      console.log(`User ${user_id} updated in database`);
    } else {
      // Add new user - created_at will be set by default in the database
      user = await db.insertData(USERS_TABLE, userData);
      console.log(`User ${user_id} created in database`);
    }

    // Return success response
    return sendSuccess(
      res,
      'User authenticated successfully',
      user,
      HTTP_STATUS.OK
    );
  } catch (error) {
    console.error('Authentication error:', error);
    return sendError(
      res,
      'Authentication failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};

module.exports = {
  authenticate
};
