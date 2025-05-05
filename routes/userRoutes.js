const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const appointmentController = require("../controllers/appointmentController")
const prescriptionController = require("../controllers/prescriptionController")

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/appointments', appointmentController.scheduleAppointment);
router.get('/:userId/appointments', appointmentController.getAppointmentsByUser);
router.get('/:userId/prescriptions', prescriptionController.getPrescriptionsByPatient);
router.get('/:userId/tests', userController.getTestsForPatient);
router.get('/', userController.getAllUsers);
router.get('/:userID/get-appointments', userController.getScheduledAppointments);
router.get('/patients/:userId/tests', userController.getScheduledTests);
// router.get('/report/download/:testId', userController.downloadReport);


module.exports = router;


// const express = require('express');
// const { loginUser, registerUser } = require('../controllers/userController');
// const { protect } = require('../middleware/auth');

// const router = express.Router();

// router.post('/register', registerUser);
// router.post('/login', loginUser);
// router.get('/profile', protect, (req, res) => {
//   res.json({ message: "User Profile Accessed", user: req.user });
// });

// module.exports = router;
