const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');

// POST /api/medicine/add-medicine
router.post('/add-medicine', medicineController.addMedicine);

module.exports = router;
