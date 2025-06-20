const express = require('express');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const { sendError, HTTP_STATUS } = require('./utils/response');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Mount auth routes
app.use('/api/auth', authRoutes);

// Mount user routes (formerly protected routes)
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  return sendError(
    res,
    'Something went wrong!',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    err
  );
});

module.exports = app;
