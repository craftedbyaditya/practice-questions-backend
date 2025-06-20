// STANDALONE SERVERLESS FUNCTION - NO IMPORTS FROM MAIN APP

const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    message: 'API health check successful',
    envVars: {
      // List environment variables names that are available (without showing values)
      available: Object.keys(process.env)
    }
  });
});

// Basic auth route that doesn't use Supabase
app.post('/api/auth/test', (req, res) => {
  const { user_id, name, role } = req.body;
  
  if (!user_id || !name) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['user_id', 'name']
    });
  }
  
  return res.status(200).json({
    success: true,
    message: 'Test auth successful',
    user: {
      user_id,
      name,
      role: role || ['user'],
      created: new Date().toISOString()
    }
  });
});

// Export the express app as a serverless function
module.exports = app;
