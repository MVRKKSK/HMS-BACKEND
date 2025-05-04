const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Route for importing doctors from CSV
// router.post('/import-doctors', upload.single('csvFile'), adminController.importDoctorsFromCSV);
router.post('/import-users', upload.single('csvFile'), adminController.importUsersFromCSV);


router.post('/add-doctor', adminController.addDoctor);
router.post('/add-admin-user', adminController.addAdminUser);


module.exports = router;