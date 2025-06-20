/**
 * Security middleware configuration
 * Centralizes all security-related middleware setup
 */
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const config = require('../config');
const { sendError, HTTP_STATUS } = require('../utils/response');

/**
 * Configure and return security middleware
 * @returns {Object} Object containing security middleware functions
 */
const securityMiddleware = {
  /**
   * Configure and return Helmet middleware for HTTP security headers
   */
  helmet: () => {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' },
    });
  },

  /**
   * Configure and return CORS middleware
   */
  cors: () => {
    return cors({
      origin: config.security.cors.origin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Roles'],
      credentials: config.security.cors.credentials,
      maxAge: 86400, // 24 hours
    });
  },

  /**
   * Configure and return rate limiting middleware
   */
  rateLimit: () => {
    return rateLimit({
      windowMs: config.security.rateLimit.windowMs,
      max: config.security.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        status: 'Failure',
        message: 'Too many requests, please try again later.',
        data: []
      }
    });
  },

  /**
   * Validate request body based on validation rules
   * @param {Array} validations - Array of express-validator validation rules
   * @returns {Function} Express middleware
   */
  validateRequest: (validations) => {
    return async (req, res, next) => {
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      return sendError(
        res,
        'Validation failed',
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        { details: errors.array() }
      );
    };
  },

  /**
   * Common validation rules for reuse across routes
   */
  validationRules: {
    authenticate: [
      body('user_id').notEmpty().withMessage('user_id is required'),
      body('name').notEmpty().withMessage('name is required'),
      body('role').isArray().withMessage('role must be an array'),
      body('role.*').isString().withMessage('Each role must be a string'),
      body('mobile_no').optional().isString(),
      body('gender').optional().isString(),
      body('dob').optional().isString()
    ]
  }
};

module.exports = securityMiddleware;
