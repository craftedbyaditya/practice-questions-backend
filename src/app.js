const express = require('express');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const examRoutes = require('./routes/exam.routes');
const subjectRoutes = require('./routes/subject.routes');
const topicRoutes = require('./routes/topic.routes');
const translationRoutes = require('./routes/translation.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const { sendError, HTTP_STATUS } = require('./utils/response');
const { extractRoles } = require('./middleware/role.middleware');
const { helmet, cors, rateLimit } = require('./middleware/security.middleware');
const authMiddleware = require('./middleware/auth.middleware');
const config = require('./config');

const app = express();

// Security Middleware - Apply before route handlers
app.use(helmet()); // Set security HTTP headers
app.use(cors()); // Enable CORS for all routes

// Rate limiting - Only apply in production
if (config.isProd) {
  app.use(rateLimit());
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Extract user roles and user ID from headers for all routes
app.use(extractRoles);
app.use(authMiddleware);

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

// Mount exam routes
app.use('/api/exams', examRoutes);

// Mount subject routes
app.use('/api/subjects', subjectRoutes);

// Mount topic routes
app.use('/api/topics', topicRoutes);

// Mount translation routes
app.use('/api/translations', translationRoutes);

// Mount enrollment routes
app.use('/api/enrollments', enrollmentRoutes);

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
