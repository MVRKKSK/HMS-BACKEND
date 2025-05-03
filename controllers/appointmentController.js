const db = require('../config/db'); // adjust path to your MySQL config

// Schedule a new appointment
exports.scheduleAppointment = (req, res) => {
  const { UserID, DoctorID, Date, Time, Description } = req.body;
  console.log(req.body);

  if (!UserID || !DoctorID || !Date || !Time) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const getPatientQuery = `SELECT PatientID FROM Patients WHERE UserID = ?`;
  db.query(getPatientQuery, [UserID], (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to retrieve PatientID', error: err });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Patient not found for given UserID' });
    }

    const PatientID = results[0].PatientID;

    const insertQuery = `
      INSERT INTO ScheduleAppointments (PatientID, DoctorID, Date, Time, Description)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertQuery, [PatientID, DoctorID, Date, Time, Description], (err2, result) => {
      if (err2) {
        if (err2.sqlState === '45000') {
          return res.status(409).json({ message: err2.sqlMessage }); // Trigger error
        }
        return res.status(500).json({ message: 'You cannot book same appointment to the doctor on same day!', error: err2 });
      }

      return res.status(201).json({
        message: 'Appointment scheduled successfully',
        appointmentId: result.insertId,
      });
    });
  });
};


const getPatientQuery = `SELECT PatientID FROM Patients WHERE UserID = ?`;

exports.getAppointmentsByUser = (req, res) => {
  const userId = req.params.userId;
  console.log('User ID:', userId);

  // First, get the PatientID associated with the given UserID
  db.query(getPatientQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching patient ID:', err);
      return res.status(500).json({ message: 'Failed to fetch patient ID' });
    }

    // If no PatientID is found for the given UserID, send an error response
    if (results.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patientId = results[0].PatientID;
    console.log('Patient ID:', patientId);

    // Now, fetch appointments for the corresponding PatientID
    const query = `
      SELECT sa.AppointmentID, sa.Date, sa.Time, sa.Description, 
             d.Name AS DoctorName, d.Department, d.Cabin
      FROM ScheduleAppointments sa
      JOIN Doctors d ON sa.DoctorID = d.DoctorID
      WHERE sa.PatientID = ?
      ORDER BY sa.Date DESC, sa.Time DESC
    `;

    // Fetch appointments based on the PatientID
    db.query(query, [patientId], (err, appointmentResults) => {
      if (err) {
        console.error('Error fetching appointments:', err);
        return res.status(500).json({ message: 'Failed to fetch appointments' });
      }

      // Return the fetched appointments
      res.status(200).json(appointmentResults);
    });
  });
};
