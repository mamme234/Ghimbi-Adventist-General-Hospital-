const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  confirmAppointment,
  rescheduleAppointment,
  getDoctorAvailability,
  getAppointmentStats,
  getAppointmentByDate,
  startAppointment,
  completeAppointment,
  markNoShow
} = require('../controllers/appointmentController');

router.use(protect);

router.route('/')
  .get(getAppointments)
  .post(authorize('doctor', 'receptionist'), createAppointment);

router.route('/:id')
  .get(getAppointmentById)
  .put(authorize('doctor', 'receptionist'), updateAppointment);

router.post('/:id/cancel', 
  authorize('doctor', 'receptionist', 'patient'), 
  cancelAppointment
);

router.post('/:id/confirm', 
  authorize('receptionist'), 
  confirmAppointment
);

router.post('/:id/reschedule', 
  authorize('doctor', 'receptionist'), 
  rescheduleAppointment
);

router.get('/doctor/availability', getDoctorAvailability);
router.get('/stats', authorize('administrator'), getAppointmentStats);
router.get('/date/:date', getAppointmentByDate);

router.post('/:id/start', 
  authorize('doctor'), 
  startAppointment
);

router.post('/:id/complete', 
  authorize('doctor'), 
  completeAppointment
);

router.post('/:id/no-show', 
  authorize('receptionist'), 
  markNoShow
);

module.exports = router;
