/**
 * Simple pass-through middleware with no authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = (req, res, next) => {
  // No authentication - all requests are allowed
  // We'll just set a default user for demonstration purposes
  req.user = {
    user_id: 'anonymous',
    name: 'Anonymous User',
    role: 'guest'
  };
  
  // Call next middleware
  next();
};

module.exports = authMiddleware;
