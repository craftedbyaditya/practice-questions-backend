/**
 * Auth middleware to extract user ID and roles from request headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = (req, res, next) => {
  // Extract user ID from X-User-ID header
  const userId = req.headers['x-user-id'];
  
  if (userId) {
    // Set user ID in request for downstream handlers
    req.userId = userId;
  } else {
    // Set a default user ID for demonstration or development purposes
    req.userId = 'anonymous';
  }

  // Extract user roles from X-User-Roles header
  const userRoles = req.headers['x-user-roles'];
  
  if (userRoles) {
    try {
      // Parse the roles if it's a JSON string array
      req.userRoles = typeof userRoles === 'string' ? JSON.parse(userRoles) : userRoles;
      // Ensure userRoles is always an array
      if (!Array.isArray(req.userRoles)) {
        req.userRoles = [req.userRoles];
      }
    } catch (error) {
      // If parsing fails, assume it's a single role
      req.userRoles = [userRoles];
    }
  } else {
    // Set default roles if none provided
    req.userRoles = ['user'];
  }
  
  // Call next middleware
  next();
};

module.exports = authMiddleware;
