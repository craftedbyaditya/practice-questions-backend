/**
 * Response utilities for consistent API responses
 */

/**
 * Send a success response with standardized format
 * 
 * @param {object} res - Express response object
 * @param {string} message - Success message to display
 * @param {any} data - Data to return (will be kept as-is if array, otherwise wrapped in array)
 * @param {number} statusCode - HTTP status code (defaults to 200)
 * @returns {object} Express response
 */
const sendSuccess = (res, message = 'Operation successful', data = [], statusCode = 200) => {
  // Ensure data is either kept as array or converted to empty array if null/undefined
  const responseData = Array.isArray(data) ? data : (data || []);
  
  return res.status(statusCode).json({
    status: 'Success',
    message,
    data: responseData,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send an error response with standardized format
 * 
 * @param {object} res - Express response object
 * @param {string} message - Error message to display
 * @param {number} statusCode - HTTP status code (defaults to 400)
 * @param {Error} error - Optional error object for development environments
 * @returns {object} Express response
 */
const sendError = (res, message = 'Operation failed', statusCode = 400, error = null) => {
  const response = {
    status: 'Failure',
    message,
    data: [],
    timestamp: new Date().toISOString()
  };

  // Include error details in non-production environments
  if (error && process.env.NODE_ENV !== 'production') {
    response.error = {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
  }

  return res.status(statusCode).json(response);
};

/**
 * Common HTTP status codes with semantic names for readability
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

module.exports = {
  sendSuccess,
  sendError,
  HTTP_STATUS
};
