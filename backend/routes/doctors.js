const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const doctorController = require('../controllers/doctorController');

router.use(protect);

router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);
router.post('/', doctorController.createDoctor);
router.put('/:id', doctorController.updateDoctor);

module.exports = router;
