require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import modules
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { metricsMiddleware, metricsEndpoint, healthCheck } = require('./monitoring');
const ChatHandler = require('./socket/chatHandler');
const Scheduler = require('./scheduler');

// Initialize app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Database connection
require('./db');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['x-auth-token'],
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Metrics middleware
app.use(metricsMiddleware);

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Health check
app.get('/health', healthCheck);

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// Webhook endpoints (raw body needed)
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), require('./webhooks/paymentWebhook').handleStripeWebhook);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/nurses', require('./routes/nurses'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/laboratory', require('./routes/laboratory'));
app.use('/api/radiology', require('./routes/radiology'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/beds', require('./routes/beds'));
app.use('/api/wards', require('./routes/wards'));

// API Documentation
const { swaggerUi, swaggerDocs } = require('./swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Socket.IO
const chatHandler = new ChatHandler(io);
chatHandler.initialize();

// Track connections for monitoring
require('./monitoring').trackConnections(io);

// Error handler (must be last)
app.use(errorHandler);

// Initialize scheduler
const scheduler = new Scheduler();

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🔄 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = { app, httpServer, io };
