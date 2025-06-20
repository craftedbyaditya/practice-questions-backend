require('dotenv').config();
const fs = require('fs');
const http = require('http');
const https = require('https');
const app = require('./app');
const config = require('./config');

/**
 * Normalized port function to handle string or number port values
 */
function normalizePort(val) {
  const port = parseInt(val, 10);
  
  if (isNaN(port)) {
    return val; // Named pipe
  }
  
  if (port >= 0) {
    return port; // Port number
  }
  
  return false;
}

// Get port from config
const port = normalizePort(config.server.port);

// Create appropriate server based on environment
let server;

if (config.isProd && config.security.ssl) {
  try {
    // Create HTTPS server for production
    const privateKey = fs.readFileSync(config.security.ssl.key, 'utf8');
    const certificate = fs.readFileSync(config.security.ssl.cert, 'utf8');
    
    const credentials = { key: privateKey, cert: certificate };
    
    server = https.createServer(credentials, app);
    console.log('HTTPS server created successfully');
  } catch (error) {
    console.error('Failed to create HTTPS server:', error.message);
    console.warn('Falling back to HTTP server');
    server = http.createServer(app);
  }
} else {
  // Create HTTP server for development/test
  server = http.createServer(app);
}

// Start the server
server.listen(port, config.server.host);

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  
  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log(`Server running on ${bind} in ${config.env} mode`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

