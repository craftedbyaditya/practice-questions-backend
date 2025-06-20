const express = require('express');
const { authenticate } = require('../controllers/auth.controller');
const { validateRequest, validationRules } = require('../middleware/security.middleware');

const router = express.Router();

/**
 * @route   POST /api/auth/authenticate
 * @desc    Authenticate user and store profile data
 */
router.post('/authenticate', validateRequest(validationRules.authenticate), authenticate);

module.exports = router;
