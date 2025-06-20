/**
 * Application Configuration
 * Centralizes all environment configuration with validation
 */
require('dotenv').config();

// Helper to validate required environment variables
const requiredEnvVar = (key, devFallback = null) => {
  const value = process.env[key];
  
  // In production, we must have the actual environment variable
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Environment variable ${key} is required in production mode`);
  }
  
  // In development, we can use a fallback if the variable isn't set
  return value || devFallback;
};

// Parse numeric environment variables
const parseIntEnv = (key, defaultValue) => {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Warning: ${key} environment variable is not a valid number. Using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return parsed;
};

// Parse boolean environment variables
const parseBoolEnv = (key, defaultValue) => {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

// Parse CORS origins
const parseCorsOrigins = (value) => {
  if (!value || value === '*') return '*';
  
  try {
    // Try to parse as JSON array
    if (value.startsWith('[') && value.endsWith(']')) {
      return JSON.parse(value);
    }
    
    // Otherwise split by comma
    return value.split(',').map(origin => origin.trim());
  } catch (error) {
    console.warn(`Warning: CORS_ORIGIN is not valid. Using '*' as fallback.`);
    return '*';
  }
};

// Application configuration object
const config = {
  // Core app settings
  env: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isTest: process.env.NODE_ENV === 'test',
  isProd: process.env.NODE_ENV === 'production',
  
  // Server settings
  server: {
    port: parseIntEnv('PORT', 3000),
    host: process.env.HOST || 'localhost',
  },
  
  // Security settings
  security: {
    cors: {
      origin: parseCorsOrigins(process.env.CORS_ORIGIN),
      credentials: parseBoolEnv('CORS_CREDENTIALS', true),
    },
    rateLimit: {
      windowMs: parseIntEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // Default: 15 minutes
      max: parseIntEnv('RATE_LIMIT_MAX_REQUESTS', 100), // Default: 100 requests per windowMs
    },
    ssl: process.env.NODE_ENV === 'production' && {
      key: process.env.SSL_KEY_PATH,
      cert: process.env.SSL_CERT_PATH,
    },
  },
  
  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  },
  
  // Database settings (Supabase)
  database: {
    supabase: {
      url: requiredEnvVar('SUPABASE_URL', 'https://czdvsfaeghnbitmwozmr.supabase.co'),
      key: requiredEnvVar('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6ZHZzZmFlZ2huYml0bXdvem1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njg1MTQ0MiwiZXhwIjoyMDYyNDI3NDQyfQ.1JSXyr1ev4n6aTn-Ch5LSmmcyn9ZUy3hIvz_EmNUcxE'),
      jwtSecret: process.env.SUPABASE_JWT_SECRET,
    }
  },
  
  // API Services
  services: {
    api: {
      baseUrl: requiredEnvVar('API_BASE_URL', 'practice-questions-dev.vercel.app'),
    }
  },
};

module.exports = config;
