const db = require('../config/db');
const PDFDocument = require('pdfkit');
// Get all doctors with user info

exports.getAllDoctors = async (req, res) => {
    const sql = `
    SELECT d.DoctorID, d.UserID, d.Name, d.Department, d.Cabin,
           ds.Specialization, dp.Position
    FROM Doctors d
    LEFT JOIN DoctorSpecialization ds ON d.DoctorID = ds.DoctorID
    LEFT JOIN DoctorPosition dp ON d.DoctorID = dp.DoctorID
    GROUP BY d.DoctorID, ds.Specialization, dp.Position
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching doctors:', err);
      return res.status(500).json({ message: 'Failed to fetch doctors' });
    }

    res.status(200).json(results);
  });

//   const query = `
//     SELECT d.DoctorID, d.UserID, u.Name, u.Email, u.Contact, d.Gender, d.Age, d.Department, d.Cabin
//     FROM Doctors d
//     JOIN Users u ON d.UserID = u.UserID
//   `;
//   db.query(query, (err, results) => {
//     if (err) return res.status(500).json({ error: 'Failed to fetch doctors.', details: err });
//     res.json(results);
//   });
};

const getDoctorIdByUserId = (userId, callback) => {
    const query = 'SELECT DoctorID FROM Doctors WHERE UserID = ?';
    db.query(query, [userId], (err, results) => {
      if (err || results.length === 0) {
        return callback(err || new Error('Doctor not found'));
      }
      callback(null, results[0].DoctorID);
    });
  };
  
  // ✅ Schedule a Test
  exports.scheduleTest = (req, res) => {
    const { userId, patientId, testName, date, time } = req.body;
  
    getDoctorIdByUserId(userId, (err, doctorId) => {
      if (err) return res.status(500).json({ message: 'Doctor not found' });
  
      const query = `
        INSERT INTO TestPerformed (PatientID, DoctorID, Date, Time, TestName)
        VALUES (?, ?, ?, ?, ?)
      `;
  
      db.query(query, [patientId, doctorId, date, time, testName], (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Failed to schedule test' });
        }
        res.status(201).json({ message: 'Test scheduled successfully' });
      });
    });
  };
  
  // ✅ Get Scheduled Tests for Doctor
  exports.getScheduledTestsByUserId = (req, res) => {
    const userId = req.params.userId;
  
    getDoctorIdByUserId(userId, (err, doctorId) => {
      if (err) return res.status(500).json({ message: 'Doctor not found' });
  
      const query = `
        SELECT * FROM TestPerformed
        WHERE DoctorID = ?
      `;
  
      db.query(query, [doctorId], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch tests' });
  
        res.status(200).json({ tests: results });
      });
    });
  };
  
  // ✅ Generate a Report for a Test
  exports.generateReport = (req, res) => {
    const { userId, patientId, time, description, testId } = req.body;
  
    console.log(req.body);
  
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
  
    getDoctorIdByUserId(userId, (err, doctorId) => {
      if (err) return res.status(500).json({ message: 'Doctor not found' });
  
      const query = `
        INSERT INTO GenerateReport (DoctorID, PatientID, Date, Time, TestID, Description)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
  
      db.query(query, [doctorId, patientId, today, time, testId, description], (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Failed to generate report' });
        }
  
        res.status(201).json({ message: 'Report generated successfully' });
      });
    });
  };
  
  
  // ✅ Edit Test Description
  exports.updateTestDescription = (req, res) => {
    const { patientId, doctorId, date, time, newDescription } = req.body;
  
    const query = `
      UPDATE TestPerformed
      SET Description = ?
      WHERE PatientID = ? AND DoctorID = ? AND Date = ? AND Time = ?
    `;
  
    db.query(query, [newDescription, patientId, doctorId, date, time], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: 'Failed to update description' });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Test not found' });
      }
  
      res.status(200).json({ message: 'Description updated successfully' });
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
    const { userId, patientId, testName, date, time } = req.body;
  
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
  
      // Step 2: Insert into TestPerformed table without description
      const insertQuery = `
        INSERT INTO TestPerformed (PatientID, DoctorID, Date, Time, TestName)
        VALUES (?, ?, ?, ?, ?)
      `;
  
      db.query(
        insertQuery,
        [patientId, doctorId, date, time, testName],
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