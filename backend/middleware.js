// ========== MIDDLEWARE ==========
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== AUTHENTICATION MIDDLEWARE ==========
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please provide a valid token.'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password -refreshToken');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Invalid token.'
            });
        }
        
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }
        
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please refresh your session.',
                code: 'TOKEN_EXPIRED'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.',
                code: 'INVALID_TOKEN'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Authentication failed. Please try again.'
        });
    }
};

// ========== AUTHORIZATION MIDDLEWARE ==========
const authorize = (roles = []) => {
    if (typeof roles === 'string') roles = [roles];
    
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }
        
        const hasRole = roles.some(role => req.user.role === role);
        
        if (!hasRole) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have the required permissions.',
                requiredRoles: roles,
                yourRole: req.user.role
            });
        }
        next();
    };
};

// ========== PERMISSION CHECK ==========
const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }
            
            if (user.role === 'super-admin' || user.role === 'admin') {
                return next();
            }
            
            const hasPermission = user.permissions?.includes(permission) || false;
            
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Permission denied. Required: ${permission}`
                });
            }
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Permission check failed.'
            });
        }
    };
};

// ========== DEPARTMENT ACCESS ==========
const checkDepartmentAccess = (department) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }
        
        if (['super-admin', 'admin'].includes(user.role)) {
            return next();
        }
        
        if (user.department !== department && user.role !== department) {
            return res.status(403).json({
                success: false,
                message: `Access denied. You do not have access to ${department} department.`
            });
        }
        next();
    };
};

// ========== VALIDATION MIDDLEWARE ==========
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(detail => detail.message)
            });
        }
        next();
    };
};

// ========== RATE LIMITING ==========
const rateLimiter = (options = {}) => {
    const windowMs = options.windowMs || 15 * 60 * 1000;
    const max = options.max || 100;
    const keyGenerator = options.keyGenerator || ((req) => req.ip);
    
    const store = new Map();
    
    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!store.has(key)) {
            store.set(key, []);
        }
        
        const requests = store.get(key).filter(time => time > windowStart);
        requests.push(now);
        store.set(key, requests);
        
        if (requests.length > max) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
        next();
    };
};

// ========== FILE UPLOAD ==========
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, 'uploads');
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and PDF are allowed.'));
        }
    }
});

// ========== CORS ==========
const corsMiddleware = (req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
};

// ========== LOGGING ==========
const logger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };
        
        if (req.user) {
            log.userId = req.user._id;
            log.userRole = req.user.role;
        }
        
        console.log(JSON.stringify(log));
    });
    next();
};

// ========== ERROR HANDLER ==========
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    
    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({
            success: false,
            message: `Duplicate value for ${field}. Please use a different value.`
        });
    }
    
    // JWT Error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token. Please login again.'
        });
    }
    
    // Multer Error
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(413).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    
    // Default Error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// ========== NOT FOUND ==========
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
};

// ========== ASYNC WRAPPER ==========
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// ========== COMPRESSION ==========
const shouldCompress = (req, res) => {
    if (req.headers['x-no-compression']) {
        return false;
    }
    return compression.filter(req, res);
};

// ========== SECURITY HEADERS ==========
const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};

// ========== SANITIZE ==========
const sanitize = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (!obj) return obj;
        if (typeof obj === 'string') {
            return obj.replace(/[<>]/g, '').trim();
        }
        if (Array.isArray(obj)) {
            return obj.map(item => sanitizeObject(item));
        }
        if (typeof obj === 'object') {
            const cleaned = {};
            for (const key in obj) {
                cleaned[key] = sanitizeObject(obj[key]);
            }
            return cleaned;
        }
        return obj;
    };
    
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    next();
};

module.exports = {
    authenticate,
    authorize,
    checkPermission,
    checkDepartmentAccess,
    validate,
    rateLimiter,
    upload,
    corsMiddleware,
    logger,
    errorHandler,
    notFound,
    asyncHandler,
    shouldCompress,
    securityHeaders,
    sanitize
};
