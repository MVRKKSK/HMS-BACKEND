const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { getAllMedicines } = require('../controllers/prescriptionController');

// POST /api/medicine/add-medicine
router.post('/add-medicine', medicineController.addMedicine);
router.get('/get-medicines', getAllMedicines);

module.exports = router;
