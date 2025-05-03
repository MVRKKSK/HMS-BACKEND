const express = require('express');
const router = express.Router();
const { createPrescription, getPrescriptionsByPatient, getAllMedicines } = require('../controllers/prescriptionController');

router.post('/create', createPrescription);
router.get('/medicines', getAllMedicines);
router.use('/getPrescription', getPrescriptionsByPatient);
// router.get('/patient/:userId', getPrescriptionsByPatient);

module.exports = router;
