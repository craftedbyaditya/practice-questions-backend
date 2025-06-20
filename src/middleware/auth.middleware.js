/**
 * Auth middleware to extract user ID from request headers
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
  
  // Call next middleware
  next();
};

module.exports = authMiddleware;
