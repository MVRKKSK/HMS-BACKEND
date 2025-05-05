

const db = require('../config/db');

exports.addMedicine = (req, res) => {
  const { MedicineName, Company, Dosage } = req.body;

  if (!MedicineName || !Company || !Dosage) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = `INSERT INTO Medicine (MedicineName, Company, Dosage) VALUES (?, ?, ?)`;

  db.query(sql, [MedicineName, Company, Dosage], (err, result) => {
    if (err) {
      console.error('Error inserting medicine:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(201).json({ message: 'Medicine added successfully' });
  });
};

// controllers/medicineController.js

exports.getAllMedicines = (req, res) => {
  const query = 'SELECT * FROM Medicine';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching medicines:', err);
      return res.status(500).json({ message: 'Failed to fetch medicines', error: err });
    }

    res.status(200).json({ medicines: results });
  });
};
