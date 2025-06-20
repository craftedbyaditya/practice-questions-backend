// Serverless entry point for Vercel deployment
// Load environment variables
require('dotenv').config();

const express = require('express');

// Keep the standalone health check for diagnostics
const healthCheckApp = express();

// Add the health check route to verify environment variables
healthCheckApp.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    message: 'API health check successful',
    envVars: {
      // List environment variable names only (no values for security)
      available: Object.keys(process.env),
      // Check if critical variables are set (without showing values)
      hasCriticalVars: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_KEY: !!process.env.SUPABASE_KEY,
        API_BASE_URL: !!process.env.API_BASE_URL
      }
    }
  });
});

// Use a try/catch to safely attempt to load the main app
let mainApp;
try {
  // Import the main Express app
  mainApp = require('../src/app');
  console.log('Main application loaded successfully');
} catch (error) {
  console.error('Error loading main application:', error);
  
  // Create a fallback app if main app fails to load
  const fallbackApp = express();
  
  fallbackApp.use(express.json());
  
  fallbackApp.all('*', (req, res) => {
    return res.status(500).json({
      success: false,
      message: 'Application failed to initialize',
      error: error.message,
      path: req.path
    });
  });
  
  mainApp = fallbackApp;
}

// Combine the health check and main app
const combinedApp = express();

// Mount the health check app
combinedApp.use(healthCheckApp);

// Mount the main app - all other routes go to the main app
combinedApp.use(mainApp);

// Export the express app as a serverless function
module.exports = combinedApp;
