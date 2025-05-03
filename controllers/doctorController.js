const db = require('../config/db');
const PDFDocument = require('pdfkit');
// Get all doctors with user info
exports.getAllDoctors = (req, res) => {
  const query = `
    SELECT d.DoctorID, d.UserID, u.Name, u.Email, u.Contact, d.Gender, d.Age, d.Department, d.Cabin
    FROM Doctors d
    JOIN Users u ON d.UserID = u.UserID
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch doctors.', details: err });
    res.json(results);
  });
};

exports.downloadReport = async (req, res) => {
    try {
        const { patientId, doctorId, date, time } = req.query;

        const [rows] = await db.query(
            `SELECT * FROM GenerateReport WHERE PatientID = ? AND DoctorID = ? AND Date = ? AND Time = ?`,
            [patientId, doctorId, date, time]
        );

        const report = rows[0];

        if (!report) {
            return res.status(404).send('Report not found.');
        }

        const doc = new PDFDocument();
        res.setHeader('Content-disposition', 'attachment; filename=report.pdf');
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        doc.fontSize(18).text('Medical Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Patient ID: ${report.PatientID}`);
        doc.text(`Doctor ID: ${report.DoctorID}`);
        doc.text(`Date: ${report.Date}`);
        doc.text(`Time: ${report.Time}`);
        doc.moveDown();
        doc.text(`Description:`);
        doc.text(report.Description || 'No description provided.', { indent: 20 });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


exports.scheduleTest = (req, res) => {
  const { userId, patientId, testName, date, time, description } = req.body;

    // Step 1: Get DoctorID from userId
    const getDoctorQuery = `SELECT DoctorID FROM Doctors WHERE UserID = ?`;
    db.query(getDoctorQuery, [userId], (err, doctorResult) => {
        if (err) {
            console.error('Error retrieving doctor ID:', err);
            return res.status(500).json({ message: 'Failed to retrieve doctor ID' });
        }

        if (doctorResult.length === 0) {
            return res.status(404).json({ message: 'Doctor not found for the given user' });
        }

        const doctorId = doctorResult[0].DoctorID;

        // Step 2: Insert into TestPerformed table
        const insertQuery = `
            INSERT INTO TestPerformed (PatientID, DoctorID, Date, Time, TestName, Description)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(
            insertQuery,
            [patientId, doctorId, date, time, testName, description],
            (err, result) => {
                if (err) {
                    console.error('Error scheduling test:', err);
                    return res.status(500).json({ message: 'Failed to schedule test' });
                }

                return res.status(201).json({ message: 'Test scheduled successfully' });
            }
        );
    });
};
// Adjust path to your DB module

exports.getDoctorAppointments = (req, res) => {
    const userId = req.params.userID; // assuming userID is extracted from JWT or session
    console.log(userId)
    // Step 1: Get DoctorID using UserID
    const getDoctorQuery = `SELECT DoctorID FROM Doctors WHERE UserID = ?`;
    console.log(userId)
    db.query(getDoctorQuery, [userId], (err, doctorResult) => {
        if (err) {
            console.error('Error retrieving doctor ID:', err);
            return res.status(500).json({ message: 'Failed to retrieve doctor ID' });
        }

        if (doctorResult.length === 0) {
            return res.status(404).json({ message: 'Doctor not found for the given user' });
        }

        const doctorId = doctorResult[0].DoctorID;

        // Step 2: Get appointments for the doctor
        const fetchAppointmentsQuery = `
            SELECT sa.AppointmentID, sa.PatientID, sa.Date, sa.Time, sa.Description,
                   p.Name AS PatientName, p.Age as PatientAge
            FROM ScheduleAppointments sa
            JOIN Patients p ON sa.PatientID = p.PatientID
            WHERE sa.DoctorID = ?
            ORDER BY sa.Date, sa.Time;
        `;

        db.query(fetchAppointmentsQuery, [doctorId], (err, appointmentResults) => {
            if (err) {
                console.error('Error fetching appointments:', err);
                return res.status(500).json({ message: 'Failed to fetch appointments' });
            }

            return res.status(200).json(appointmentResults);
        });
    });
};


// import Doctor from "../models/DoctorSchema.js";
// import Booking from "../models/BookingSchema.js";

// export const updateDoctor = async (req, res) => {
//   const id = req.params.id;

//   try {
//     const updatedDoctor = await Doctor.findByIdAndUpdate(
//       id,
//       { $set: req.body },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Details updated successfully",
//       data: updatedDoctor,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       success: false,
//       message: "Update failed",
//     });
//   }
// };

// export const deleteDoctor = async (req, res) => {
//   const id = req.params.id;

//   try {
//     await Doctor.findByIdAndUpdate(id);

//     res.status(200).json({
//       success: true,
//       message: "Successfully deleted",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete",
//     });
//   }
// };

// export const getSingleDoctor = async (req, res) => {
//   const id = req.params.id;

//   try {
//     const doctor = await Doctor.findById(id)
//       .populate("reviews")
//       .select("-password");

//     res.status(200).json({
//       success: true,
//       message: "User found",
//       data: doctor,
//     });
//   } catch (error) {
//     res.status(404).json({
//       success: false,
//       message: "No user found",
//     });
//   }
// };

// export const getAllDoctor = async (req, res) => {
//   try {
//     const { query } = req.query;
//     let doctors;

//     if (query) {
//       doctors = await Doctor.find({
//         isApproved: "approved",
//         $or: [
//           { name: { $regex: query, $options: "i" } },
//           { specialization: { $regex: query, $options: "i" } },
//         ],
//       }).select("-password");
//     } else {
//       doctors = await Doctor.find({ isApproved: "approved" }).select(
//         "-password"
//       );
//     }

//     res.status(200).json({
//       success: true,
//       message: "Users found",
//       data: doctors,
//     });
//   } catch (error) {
//     res.status(404).json({
//       success: false,
//       message: "Not found",
//     });
//   }
// };

// export const getDoctorProfile = async (req, res) => {
//   const doctorId = req.userId;

//   try {
//     const doctor = await Doctor.findById(doctorId);

//     if(!doctor) {
//       return res.status(404).json({
//         success: false,
//         message: "Doctor not found",
//       });
//     }

//     const {password, ...rest} = doctor._doc;
//     const appointments = await Booking.find({doctor: doctorId});
//     res.status(200).json({
//       success: true,
//       message: "User profile fetched successfully",
//       data: {...rest, appointments},
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong, cannot get user details",
//     });
//   }
// }