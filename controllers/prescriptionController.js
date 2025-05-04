const db = require('../config/db');

exports.createPrescription = (req, res) => {
  const { userId, patientId, date, time, medicines } = req.body;

  const getDoctorQuery = 'SELECT DoctorID FROM Doctors WHERE UserID = ?';
  db.query(getDoctorQuery, [userId], (err, doctorResult) => {
    if (err || doctorResult.length === 0) return res.status(500).json({ message: 'Doctor not found' });

    const doctorId = doctorResult[0].DoctorID;
    const insertPrescriptionQuery = 'INSERT INTO Prescription (PatientID, DoctorID, Date, Time) VALUES (?, ?, ?, ?)';

    db.query(insertPrescriptionQuery, [patientId, doctorId, date, time], (err, result) => {
      if (err) return res.status(500).json({ message: 'Error creating prescription' });
      const prescriptionId = result.insertId;
      const values = medicines.map(medId => [prescriptionId, medId]);

      const insertContainsQuery = 'INSERT INTO Contains (PrescriptionID, MedicineID) VALUES ?';
      db.query(insertContainsQuery, [values], (err) => {
        if (err) return res.status(500).json({ message: 'Error linking medicines' });
        res.status(200).json({ message: 'Prescription created successfully' });
      });
    });
  });
};

// Get prescriptions for a patient using UserID
exports.getPrescriptionsByPatient = (req, res) => {
  const userId = req.params.userId;

  const getPatientIDQuery = `SELECT PatientID FROM Patients WHERE UserID = ?`;

  db.query(getPatientIDQuery, [userId], (err, result) => {
    if (err || result.length === 0) {
      console.log(err);
      return res.status(400).json({ message: 'Patient not found' });
    }

    const patientId = result[0].PatientID;

    const getPrescriptionsQuery = `
      SELECT p.PrescriptionID, p.Date, p.Time, d.Name AS DoctorName
      FROM Prescription p
      JOIN Doctors d ON p.DoctorID = d.DoctorID
      WHERE p.PatientID = ?
      ORDER BY p.Date DESC, p.Time DESC
    `;

    db.query(getPrescriptionsQuery, [patientId], async (err, prescriptions) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: 'Error retrieving prescriptions' });
      }

      // Fetch medicines for each prescription
      const fetchMedicines = (prescriptionId) => {
        return new Promise((resolve) => {
          const medQuery = `
            SELECT m.MedicineName, m.Company, m.Dosage
            FROM Contains c
            JOIN Medicine m ON c.MedicineID = m.MedicineID
            WHERE c.PrescriptionID = ?
          `;
          db.query(medQuery, [prescriptionId], (err, meds) => {
            resolve(meds || []);
          });
        });
      };

      const enrichedPrescriptions = await Promise.all(
        prescriptions.map(async (p) => ({
          ...p,
          Medicines: await fetchMedicines(p.PrescriptionID)
        }))
      );

      res.status(200).json(enrichedPrescriptions);
    });
  });
};



exports.getAllMedicines = (req, res) => {
  const query = 'SELECT * FROM Medicine';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching medicines:', err);
      return res.status(500).json({ message: 'Failed to retrieve medicines' });
    }

    res.status(200).json(results);
  });
};