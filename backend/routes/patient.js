const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const patientController = require('../controllers/patientController');

router.use(protect);

router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', patientController.createPatient);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

module.exports = router;
