const express = require('express');

const app = express();

// Simple Hello World route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
