// ========== ROUTES ==========
const express = require('express');
const router = express.Router();

// Middleware
const {
    authenticate,
    authorize,
    validate,
    upload,
    asyncHandler,
    rateLimiter
} = require('./middleware');

// Controllers
const {
    authController,
    patientController,
    appointmentController,
    departmentController,
    pharmacyController,
    paymentController,
    dashboardController,
    notificationController
} = require('./controllers');

// ========== AUTH ROUTES ==========
router.post('/auth/register', 
    rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
    asyncHandler(authController.register)
);

router.post('/auth/login',
    rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }),
    asyncHandler(authController.login)
);

router.post('/auth/refresh-token',
    rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
    asyncHandler(authController.refreshToken)
);

router.post('/auth/logout',
    authenticate,
    asyncHandler(authController.logout)
);

router.post('/auth/forgot-password',
    rateLimiter({ windowMs: 15 * 60 * 1000, max: 3 }),
    asyncHandler(authController.forgotPassword)
);

router.post('/auth/reset-password',
    rateLimiter({ windowMs: 15 * 60 * 1000, max: 3 }),
    asyncHandler(authController.resetPassword)
);

// ========== PATIENT ROUTES ==========
router.get('/patients',
    authenticate,
    authorize(['admin', 'doctor', 'receptionist']),
    asyncHandler(patientController.getAll)
);

router.get('/patients/:id',
    authenticate,
    asyncHandler(patientController.getOne)
);

router.post('/patients',
    authenticate,
    authorize(['admin', 'receptionist']),
    asyncHandler(patientController.create)
);

router.put('/patients/:id',
    authenticate,
    authorize(['admin', 'receptionist', 'doctor']),
    asyncHandler(patientController.update)
);

router.delete('/patients/:id',
    authenticate,
    authorize(['admin']),
    asyncHandler(patientController.delete)
);

router.get('/patients/patient-id/:patientId',
    authenticate,
    asyncHandler(patientController.getByPatientId)
);

router.get('/patients/:id/appointments',
    authenticate,
    asyncHandler(patientController.getAppointments)
);

router.get('/patients/:id/medical-records',
    authenticate,
    authorize(['admin', 'doctor']),
    asyncHandler(patientController.getMedicalRecords)
);

router.get('/patients/:id/qr-code',
    authenticate,
    asyncHandler(patientController.generateQR)
);

// ========== APPOINTMENT ROUTES ==========
router.get('/appointments',
    authenticate,
    asyncHandler(appointmentController.getAll)
);

router.get('/appointments/:id',
    authenticate,
    asyncHandler(appointmentController.getOne)
);

router.post('/appointments',
    authenticate,
    authorize(['admin', 'receptionist', 'doctor']),
    asyncHandler(appointmentController.create)
);

router.put('/appointments/:id',
    authenticate,
    authorize(['admin', 'receptionist', 'doctor']),
    asyncHandler(appointmentController.update)
);

router.delete('/appointments/:id',
    authenticate,
    authorize(['admin', 'receptionist']),
    asyncHandler(appointmentController.cancel)
);

router.get('/appointments/doctor/:doctorId',
    authenticate,
    asyncHandler(appointmentController.getDoctorAppointments)
);

router.get('/appointments/patient/:patientId',
    authenticate,
    asyncHandler(appointmentController.getPatientAppointments)
);

// ========== DEPARTMENT ROUTES ==========
router.get('/departments',
    asyncHandler(departmentController.getAll)
);

router.get('/departments/:id',
    asyncHandler(departmentController.getOne)
);

router.post('/departments',
    authenticate,
    authorize(['admin', 'super-admin']),
    asyncHandler(departmentController.create)
);

router.put('/departments/:id',
    authenticate,
    authorize(['admin', 'super-admin']),
    asyncHandler(departmentController.update)
);

router.delete('/departments/:id',
    authenticate,
    authorize(['admin', 'super-admin']),
    asyncHandler(departmentController.delete)
);

// ========== PHARMACY ROUTES ==========
router.get('/pharmacy/medicines',
    authenticate,
    asyncHandler(pharmacyController.getAllMedicines)
);

router.get('/pharmacy/medicines/:id',
    authenticate,
    asyncHandler(pharmacyController.getMedicine)
);

router.post('/pharmacy/medicines',
    authenticate,
    authorize(['admin', 'pharmacist']),
    asyncHandler(pharmacyController.createMedicine)
);

router.put('/pharmacy/medicines/:id',
    authenticate,
    authorize(['admin', 'pharmacist']),
    asyncHandler(pharmacyController.updateMedicine)
);

router.delete('/pharmacy/medicines/:id',
    authenticate,
    authorize(['admin', 'pharmacist']),
    asyncHandler(pharmacyController.deleteMedicine)
);

router.get('/pharmacy/stock/check',
    authenticate,
    authorize(['admin', 'pharmacist']),
    asyncHandler(pharmacyController.checkStock)
);

router.put('/pharmacy/medicines/:id/stock',
    authenticate,
    authorize(['admin', 'pharmacist']),
    asyncHandler(pharmacyController.updateStock)
);

// ========== PAYMENT ROUTES ==========
router.get('/payments',
    authenticate,
    authorize(['admin', 'finance']),
    asyncHandler(paymentController.getAll)
);

router.get('/payments/:id',
    authenticate,
    authorize(['admin', 'finance']),
    asyncHandler(paymentController.getOne)
);

router.post('/payments',
    authenticate,
    authorize(['admin', 'finance', 'receptionist']),
    asyncHandler(paymentController.create)
);

router.put('/payments/:id',
    authenticate,
    authorize(['admin', 'finance']),
    asyncHandler(paymentController.update)
);

router.post('/payments/process',
    authenticate,
    authorize(['admin', 'finance']),
    asyncHandler(paymentController.process)
);

// ========== DASHBOARD ROUTES ==========
router.get('/dashboard/stats',
    authenticate,
    asyncHandler(dashboardController.getStats)
);

router.get('/dashboard/patient-stats',
    authenticate,
    authorize(['admin', 'doctor']),
    asyncHandler(dashboardController.getPatientStats)
);

// ========== NOTIFICATION ROUTES ==========
router.get('/notifications',
    authenticate,
    asyncHandler(notificationController.getUserNotifications)
);

router.put('/notifications/:id/read',
    authenticate,
    asyncHandler(notificationController.markAsRead)
);

router.put('/notifications/read-all',
    authenticate,
    asyncHandler(notificationController.markAllAsRead)
);

router.delete('/notifications/:id',
    authenticate,
    asyncHandler(notificationController.delete)
);

// ========== FILE UPLOAD ROUTES ==========
router.post('/upload/single',
    authenticate,
    upload.single('file'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        res.json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    })
);

router.post('/upload/multiple',
    authenticate,
    upload.array('files', 10),
    asyncHandler(async (req, res) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }
        
        const files = req.files.map(file => ({
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        }));
        
        res.json({
            success: true,
            message: 'Files uploaded successfully',
            data: files
        });
    })
);

// ========== HEALTH CHECK ==========
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2027.1.0'
    });
});

module.exports = router;
