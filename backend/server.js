// ========== SERVER CONFIGURATION ==========
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// ========== IMPORT MODULES ==========
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const departmentRoutes = require('./routes/department.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');
const laboratoryRoutes = require('./routes/laboratory.routes');
const radiologyRoutes = require('./routes/radiology.routes');
const financeRoutes = require('./routes/finance.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const aiRoutes = require('./routes/ai.routes');
const uploadRoutes = require('./routes/upload.routes');
const notificationRoutes = require('./routes/notification.routes');
const ambulanceRoutes = require('./routes/ambulance.routes');
const hrRoutes = require('./routes/hr.routes');

// ========== MIDDLEWARE ==========
const { authenticate, authorize } = require('./middleware/auth.middleware');
const { errorHandler } = require('./middleware/error.middleware');
const { logger, httpLogger } = require('./middleware/logger.middleware');

// ========== CONFIGURATION ==========
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['https://ghimbi-adventist-general-hospital-2.vercel.app', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gimbi-hospital';

// ========== SECURITY MIDDLEWARE ==========
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "res.cloudinary.com"],
            fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "ws://localhost:5000", "wss://ghimbi-adventist-general-hospital-1.onrender.com"]
        }
    }
}));

app.use(cors({
    origin: ['https://ghimbi-adventist-general-hospital-2.vercel.app', 'http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(mongoSanitize());
app.use(httpLogger);

// ========== RATE LIMITING ==========
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// ========== STATIC FILES ==========
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ========== DATABASE CONNECTION ==========
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📁 Database: ${mongoose.connection.name}`);
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
});

mongoose.connection.on('error', err => {
    console.error('❌ MongoDB Error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB Disconnected');
});

// ========== SOCKET.IO ==========
io.on('connection', (socket) => {
    console.log(`🔌 Socket Connected: ${socket.id}`);
    
    socket.on('authenticate', (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            socket.join(`user_${decoded.id}`);
            console.log(`🔐 User ${decoded.id} authenticated on socket`);
        } catch (error) {
            socket.emit('error', { message: 'Authentication failed' });
        }
    });
    
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`📢 Socket ${socket.id} joined room: ${room}`);
    });
    
    socket.on('leave_room', (room) => {
        socket.leave(room);
        console.log(`📢 Socket ${socket.id} left room: ${room}`);
    });
    
    socket.on('disconnect', () => {
        console.log(`🔌 Socket Disconnected: ${socket.id}`);
    });
});

// Make io accessible to routes
app.set('io', io);

// ========== API ROUTES ==========
// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime(),
        version: '2027.1.0',
        environment: process.env.NODE_ENV || 'development',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/patients', authenticate, patientRoutes);
app.use('/api/doctors', authenticate, doctorRoutes);
app.use('/api/appointments', authenticate, appointmentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/pharmacy', authenticate, pharmacyRoutes);
app.use('/api/laboratory', authenticate, laboratoryRoutes);
app.use('/api/radiology', authenticate, radiologyRoutes);
app.use('/api/finance', authenticate, financeRoutes);
app.use('/api/admin', authenticate, authorize(['admin', 'super-admin']), adminRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', authenticate, uploadRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/ambulance', authenticate, ambulanceRoutes);
app.use('/api/hr', authenticate, hrRoutes);

// ========== ERROR HANDLING ==========
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// ========== START SERVER ==========
server.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🏥 Gimbi Adventist General Hospital API`);
    console.log('='.repeat(60));
    console.log(`🚀 Server running on port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60));
});

// ========== GRACEFUL SHUTDOWN ==========
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('💾 Closing MongoDB connection...');
        mongoose.connection.close(false, () => {
            console.log('👋 Process terminated');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('💾 Closing MongoDB connection...');
        mongoose.connection.close(false, () => {
            console.log('👋 Process terminated');
            process.exit(0);
        });
    });
});

// ========== EXPORT FOR TESTING ==========
module.exports = { app, server, io };
