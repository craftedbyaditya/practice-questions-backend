// Serverless entry point for Vercel deployment
require('dotenv').config();

// Force production mode for Vercel deployment
process.env.NODE_ENV = 'production';

// Import Express app but don't call listen - Vercel will handle that
const app = require('../src/app');

// Export the Express app as a serverless function
module.exports = app;
