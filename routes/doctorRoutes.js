const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

router.get('/', doctorController.getAllDoctors);
router.post('/schedule-test', doctorController.scheduleTest);
router.get('/:userID/appointments', doctorController.getDoctorAppointments);
router.get('/tests/:userId', doctorController.getScheduledTestsByUserId);
router.post('/generate-report', doctorController.generateReport);
router.put('/edit-description', doctorController.updateTestDescription);

module.exports = router;
// import {
//   updateDoctor,
//   deleteDoctor,
//   getSingleDoctor,
//   getAllDoctor,
//   getDoctorProfile,
// } from "../Controllers/doctorController.js";
// import { authenticate, restrict } from "../auth/verifyToken.js";
// import reviewRoutes from "./review.js";

// doctorRoutes.use("/doctorId/reviews", reviewRoutes);
// doctorRoutes.get("/:id", getSingleDoctor);
// doctorRoutes.get("/", getAllDoctor);
// doctorRoutes.put("/:id", authenticate, restrict(["admin", "doctor"]), updateDoctor);
// doctorRoutes.delete("/:id", authenticate, restrict(["admin", "doctor"]), deleteDoctor);
// doctorRoutes.get(
//   "/profile/me",
//   authenticate,
//   restrict(["admin", "doctor"]),
//   getDoctorProfile
// );
