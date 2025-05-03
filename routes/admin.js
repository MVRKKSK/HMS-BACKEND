const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');


router.get('/get-admin-id/:userId', adminController.getAdminID);
router.post('/add-doctor', adminController.addDoctor);
router.post('/add-admin-user', adminController.addAdminUser);

module.exports = router;