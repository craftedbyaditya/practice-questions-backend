require('dotenv').config();
const app = require('./src/app');

const PORT = 3001; // Using a different port for testing

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
