/**
 * Role-based access control middleware
 */
const { sendError, HTTP_STATUS } = require('../utils/response');

/**
 * Middleware to extract user roles from request headers
 * Places roles in req.userRoles for use in subsequent middleware/routes
 */
const extractRoles = (req, res, next) => {
  // Get roles from the X-User-Roles header
  // Expecting a comma-separated list of roles like "admin,user,editor"
  const rolesHeader = req.headers['x-user-roles'];
  
  if (rolesHeader) {
    req.userRoles = rolesHeader.split(',').map(role => role.trim());
  } else {
    req.userRoles = [];
  }
  
  next();
};

/**
 * Create a middleware that requires at least one of the specified roles
 * @param {string[]} requiredRoles - Array of allowed roles
 * @returns {function} Express middleware
 */
const requireRoles = (requiredRoles) => {
  return (req, res, next) => {
    // Skip role check if no roles are required
    if (!requiredRoles || requiredRoles.length === 0) {
      return next();
    }
    
    // Check if user has no roles when roles are required
    if (!req.userRoles || req.userRoles.length === 0) {
      return sendError(
        res,
        'Access denied: No roles provided',
        HTTP_STATUS.UNAUTHORIZED
      );
    }
    
    // Check if user has at least one of the required roles
    const hasRequiredRole = req.userRoles.some(role => 
      requiredRoles.includes(role)
    );
    
    if (!hasRequiredRole) {
      return sendError(
        res,
        'Access denied: Insufficient permissions',
        HTTP_STATUS.FORBIDDEN
      );
    }
    
    // User has required role, proceed
    next();
  };
};

module.exports = {
  extractRoles,
  requireRoles
};
