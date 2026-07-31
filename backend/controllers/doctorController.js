// backend/routes/appointments.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');

// All routes require authentication
router.use(protect);

// GET all appointments
router.get('/', appointmentController.getAppointments);

// GET appointment by ID
router.get('/:id', appointmentController.getAppointmentById);

// POST create appointment
router.post('/', appointmentController.createAppointment);

// PUT update appointment
router.put('/:id', appointmentController.updateAppointment);

// DELETE appointment
router.delete('/:id', appointmentController.deleteAppointment);

// POST cancel appointment
router.post('/:id/cancel', appointmentController.cancelAppointment);

// POST confirm appointment
router.post('/:id/confirm', appointmentController.confirmAppointment);

// GET doctor availability
router.get('/doctor/availability', appointmentController.getDoctorAvailability);

module.exports = router;
