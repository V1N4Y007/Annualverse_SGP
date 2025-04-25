const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { createServer } = require('http');

// Load environment variables
dotenv.config();

// Import routes
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const departmentsRoutes = require('./routes/departments');

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Set port
const PORT = process.env.PORT || 8000;

// API routes
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/departments', departmentsRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Annual Report Portal API',
    version: '1.0.0',
    endpoints: [
      '/api/reports',
      '/api/users',
      '/api/departments',
      '/health'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, httpServer };
