const db = require("../config/db");

exports.getAdminID = (req, res) => {
    
  };

  exports.addDoctor = (req, res) => {
    const { userId, doctorUserID, specialization, qualification } = req.body;
    console.log(userId);
  
    // Step 1: Get AdminID for logging
    const getAdminQuery = `SELECT AdminID FROM Admin WHERE UserID = ?`;
    db.query(getAdminQuery, [userId], (err, adminResult) => {
      if (err) return res.status(500).json({ message: 'Database error', error: err });
      if (adminResult.length === 0) return res.status(404).json({ message: 'Admin not found' });
  
      const adminID = adminResult[0].AdminID;
  
      // Step 2: Insert into Doctors using user info
      const insertDoctorQuery = `
        INSERT INTO Doctors (UserID, Name, Gender, Age, Department, Cabin, Password)
        SELECT UserID, Name, Gender, Age, 'General', 'A1', Password FROM Users WHERE UserID = ?
      `;
  
      db.query(insertDoctorQuery, [doctorUserID], (err2, doctorResult) => {
        if (err2) return res.status(500).json({ message: 'Failed to add doctor', error: err2 });
  
        const newDoctorID = doctorResult.insertId;
  
        // Step 2.5: Update role to 'doctor'
        const updateRoleQuery = `UPDATE Users SET Role = 'doctor' WHERE UserID = ?`;
        db.query(updateRoleQuery, [doctorUserID], (errRole) => {
          if (errRole) return res.status(500).json({ message: 'Doctor added but failed to update role', error: errRole });
  
          // Step 3: Insert into Specialization, Position, AddDoctors
          const insertSpecialization = `INSERT INTO DoctorSpecialization (DoctorID, Specialization) VALUES (?, ?)`;
          const insertPosition = `INSERT INTO DoctorPosition (DoctorID, Position) VALUES (?, 'Junior')`;
          const insertLog = `INSERT INTO AddDoctors (AdminID, DoctorID) VALUES (?, ?)`;
  
          db.query(insertSpecialization, [newDoctorID, specialization], (err3) => {
            if (err3) return res.status(500).json({ message: 'Failed to insert specialization', error: err3 });
  
            db.query(insertPosition, [newDoctorID], (err4) => {
              if (err4) return res.status(500).json({ message: 'Failed to insert position', error: err4 });
  
              db.query(insertLog, [adminID, newDoctorID], (err5) => {
                if (err5) return res.status(500).json({ message: 'Doctor added but log failed', error: err5 });
  
                res.status(201).json({ message: 'Doctor added successfully' });
              });
            });
          });
        });
      });
    });
  };
  
  
  
  
  // Promote a user to admin
  exports.addAdminUser = (req, res) => {
    const { adminID, userID, position, experience } = req.body;
  
    const insertAddUser = `INSERT INTO AddUsers (AdminID, UserID, NewAdminID, Experience, Position) VALUES (?, ?, ?, ?, ?)`;
    db.query(insertAddUser, [adminID, userID, userID, experience, position], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to promote user to admin', error: err });
      res.status(201).json({ message: 'Admin user added successfully' });
    });
  };