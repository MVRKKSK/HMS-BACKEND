const db = require('../config/db');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register User (Only adds to Users, not Patients)
exports.registerUser = async (req, res) => {
  const { name, email, contact, gender, age, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userQuery = `INSERT INTO Users (Name, Email, Contact, Gender, Age, Password)
                       VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(userQuery, [name, email, contact, gender, age, hashedPassword], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'User registration failed.', details: err });
      }

      const userId = result.insertId;
      const patientQuery = `INSERT INTO Patients (UserID, Name, Gender, Age) VALUES (?, ?, ?, ?)`;

      db.query(patientQuery, [userId, name, gender, age], (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: 'User registered, but failed to add to Patients table.', details: err });
        }

        return res.status(201).json({ message: 'User registered successfully and added to Patients.', userId });
      });
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Server error during registration.', details: error.message });
  }
};



exports.loginUser = (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)

  const userQuery = `SELECT * FROM Users WHERE Email = ?`;
  db.query(userQuery, [email], async (err, results) => {
    console.log(err)
    if (err) return res.status(500).json({ message: 'Database error', details: err });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = results[0];

    const isPasswordValid = await bcrypt.compare(password, user.Password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const doctorQuery = `SELECT * FROM Doctors WHERE UserID = ?`;
    db.query(doctorQuery, [user.UserID], (err2, doctorResults) => {
      console.log(err)
      if (err2) return res.status(500).json({ message: 'Doctor check failed', details: err2 });

      const role = doctorResults.length > 0 ? 'doctor' : 'patient';

      const token = jwt.sign(
        { id: user.UserID, role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1d' }
      );

      res.status(200).json({
        message: 'Login successful',
        data: user,
        token,
        role
      });
    });
  });
};

// Controller
exports.getTestsForPatient = (req, res) => {
  const userId = req.params.userId;

  const getPatientQuery = 'SELECT PatientID FROM Patients WHERE UserID = ?';
  db.query(getPatientQuery, [userId], (err, patientResult) => {
    if (err || patientResult.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patientId = patientResult[0].PatientID;

    const testQuery = `
      SELECT tp.TestName, tp.Date, tp.Time,tp.TestID, tp.Description, d.Name AS DoctorName
      FROM TestPerformed tp
      JOIN Doctors d ON tp.DoctorID = d.DoctorID
      WHERE tp.PatientID = ?
      ORDER BY tp.Date DESC, tp.Time DESC
    `;

    db.query(testQuery, [patientId], (err, tests) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: 'Error fetching tests' });
      }

      res.status(200).json(tests);
    });
  });
};
exports.getScheduledTests = (req, res) => {
  const { userId } = req.params;

  // Step 1: Get PatientID from UserID
  const getPatientIdQuery = `SELECT PatientID FROM Patients WHERE UserID = ?`;

  db.query(getPatientIdQuery, [userId], (err, result) => {
    if (err) {
      console.error('Error retrieving patient ID:', err);
      return res.status(500).json({ message: 'Failed to retrieve patient ID' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Patient not found for the given user' });
    }

    const patientId = result[0].PatientID;

    // Step 2: Get scheduled tests with report info
    const query = `
      SELECT 
  t.TestID,
  t.PatientID,
  t.DoctorID,
  t.Date,
  t.Time,
  t.TestName,
  t.Description AS TestDescription,
  d.Name AS DoctorName, -- ✅ changed from d.DoctorName to d.Name
  IF(gr.TestID IS NOT NULL, true, false) AS ReportExists,
  gr.Description AS ReportDescription
FROM TestPerformed t
JOIN Doctors d ON t.DoctorID = d.DoctorID
LEFT JOIN GenerateReport gr ON t.TestID = gr.TestID
WHERE t.PatientID = ?

    `;

    db.query(query, [patientId], (err, results) => {
      if (err) {
        console.error('Error fetching tests:', err);
        return res.status(500).json({ message: 'Failed to fetch scheduled tests' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'No scheduled tests found for this patient' });
      }
      console.log(results)
      res.status(200).json(results);
    });
  });
};



// Get all Users
exports.getAllUsers = (req, res) => {
  db.query('SELECT * FROM Users', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users.', details: err });
    res.json(results);
  });
};

// Get scheduled appointments for a patient using their UserID
exports.getScheduledAppointments = (req, res) => {
  const userID = req.params.userID;

  const getPatientIDQuery = `SELECT PatientID FROM Patients WHERE UserID = ?`;

  db.query(getPatientIDQuery, [userID], (err, patientResult) => {
    if (err) {
      console.error('Error fetching PatientID:', err);
      return res.status(500).json({ message: 'Database error while fetching PatientID', error: err });
    }

    if (patientResult.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patientID = patientResult[0].PatientID;

    const getAppointmentsQuery = `
      SELECT 
        s.AppointmentID,
        s.Date,
        s.Time,
        s.Description,
        d.Name AS DoctorName
      FROM ScheduleAppointments s
      JOIN Doctors d ON s.DoctorID = d.DoctorID
      WHERE s.PatientID = ?
      ORDER BY s.Date, s.Time
    `;

    db.query(getAppointmentsQuery, [patientID], (err2, appointments) => {
      if (err2) {
        console.error('Error fetching appointments:', err2);
        return res.status(500).json({ message: 'Failed to fetch appointments', error: err2 });
      }

      res.status(200).json(appointments);
    });
  });
};
const { PDFDocument } = require('pdfkit');

exports.downloadReport = (req, res) => {
  const { testId } = req.params; // Assuming testId is passed in the URL

  // First, fetch the test details based on testId
  db.query(
    `SELECT * FROM TestPerformed WHERE TestID = ?`,
    [testId],
    (err, testResults) => {
      if (err) {
        console.error('Error fetching test details:', err);
        return res.status(500).send('Server Error');
      }

      if (testResults.length === 0) {
        return res.status(404).send('Test not found');
      }

      const test = testResults[0];

      // Now, fetch the corresponding report details
      db.query(
        `SELECT * FROM GenerateReport WHERE TestID = ?`,
        [testId],
        (err, reportResults) => {
          if (err) {
            console.error('Error fetching report:', err);
            return res.status(500).send('Server Error');
          }

          if (reportResults.length === 0) {
            return res.status(404).send('Report not found');
          }

          const report = reportResults[0];

          // Create PDF
          const doc = new PDFDocument();
          res.setHeader('Content-disposition', 'attachment; filename=report.pdf');
          res.setHeader('Content-type', 'application/pdf');
          doc.pipe(res);

          doc.fontSize(18).text('Medical Test Report', { align: 'center' });
          doc.moveDown();
          doc.fontSize(12).text(`Test Name: ${test.TestName}`);
          doc.text(`Patient ID: ${test.PatientID}`);
          doc.text(`Doctor Name: ${test.DoctorName}`);
          doc.text(`Date: ${test.Date}`);
          doc.text(`Time: ${test.Time}`);
          doc.moveDown();
          doc.text(`Report Description:`);
          doc.text(report.Description || 'No description provided.', { indent: 20 });

          doc.end();
        }
      );
    }
  );
};

// const db = require('../config/db');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const registerUser = (req, res) => {
//   const { name, email, password } = req.body;
//   const hashed = bcrypt.hashSync(password, 10);

//   db.query(
//     'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
//     [name, email, hashed],
//     (err, result) => {
//       if (err) return res.status(500).json({ error: err.message });
//       res.status(201).json({ message: 'User Registered' });
//     }
//   );
// };

// const loginUser = (req, res) => {
//   const { email, password } = req.body;

//   db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
//     if (err || results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

//     const user = results[0];
//     const isValid = bcrypt.compareSync(password, user.password);
//     if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.json({ token });
//   });
// };

// module.exports = { registerUser, loginUser };