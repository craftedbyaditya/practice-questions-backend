const express = require('express');
const { authenticate } = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @route   POST /api/auth/authenticate
 * @desc    Authenticate user and store profile data
 */
router.post('/authenticate', authenticate);

module.exports = router;
