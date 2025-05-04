const csvParser = require('csv-parser');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const fs = require('fs');

exports.importUsersFromCSV = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileRows = [];
  const bufferStream = require('stream').Readable.from(req.file.buffer);  // Create a stream from the buffer

  // Pipe the buffer stream into csv-parser
  bufferStream
    .pipe(csvParser())
    .on('data', (row) => {
      fileRows.push(row); // Collect rows in memory
    })
    .on('end', () => {
      // Now fileRows contains all the parsed rows from the CSV file
      processRows(0, fileRows);
    })
    .on('error', (err) => {
      console.error('Error parsing CSV:', err);
      return res.status(500).json({ message: 'Failed to process CSV file', error: err });
    });

  // Recursive function to process each row
  function processRows(index, fileRows) {
    if (index >= fileRows.length) {
      return res.status(200).json({ message: 'Users imported successfully.' });
    }

    const row = fileRows[index];

    // Hash the password using bcrypt
    bcrypt.hash(row.Password, 10, (err, hashedPassword) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error hashing password', error: err });
      }

      // Insert into Users table
      const userInsertQuery = `
        INSERT INTO Users (Name, Email, Contact, Gender, Age, Password)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const userValues = [row.Name, row.Email, row.Contact, row.Gender, row.Age, hashedPassword];

      db.query(userInsertQuery, userValues, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Failed to insert user', error: err });
        }

        // Process next row
        processRows(index + 1, fileRows);
      });
    });
  }
};
// exports.importDoctorsFromCSV = (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }

//   // Parse the CSV data directly from memory
//   const fileRows = [];
//   const bufferStream = require('stream').Readable.from(req.file.buffer);

//   bufferStream
//     .pipe(csvParser())
//     .on('data', (row) => {
//       fileRows.push(row);  // Collect rows in memory
//     })
//     .on('end', () => {
//       // Prepare an array for department insertion, avoiding duplicates
//       const departments = [];

//       const insertDoctorQuery = `INSERT INTO Doctors (UserID, Name, Gender, Age, Department, Cabin, Password) VALUES ?`;
//       const doctorValues = [];
//       const insertSpecializationQuery = `INSERT INTO DoctorSpecialization (DoctorID, Specialization) VALUES ?`;
//       const specializationValues = [];
//       const insertPositionQuery = `INSERT INTO DoctorPosition (DoctorID, Position) VALUES ?`;
//       const positionValues = [];

//       fileRows.forEach(row => {
//         // Insert department if it does not exist
//         if (!departments.includes(row.Department)) {
//           departments.push(row.Department);
//         }

//         // Prepare doctor data (this will be inserted into Users table)
//         doctorValues.push([row.Name, row.Email, row.Contact, row.Gender, row.Age, row.Password]);

//         // Prepare specialization data
//         if (row.Specialization) {
//           specializationValues.push([row.UserID, row.Specialization]);
//         }

//         // Prepare position data
//         if (row.Position) {
//           positionValues.push([row.UserID, row.Position]);
//         }
//       });

//       // First, insert all departments
//       const departmentInsertQuery = `INSERT IGNORE INTO Department (DepartmentName) VALUES ?`;
//       const departmentValues = departments.map(department => [department]);

//       db.query(departmentInsertQuery, [departmentValues], (err) => {
//         if (err) {
//           console.error(err);
//           return res.status(500).json({ message: 'Failed to insert departments', error: err });
//         }

//         // Insert users (doctors) into the Users table first to get their UserID
//         db.query('INSERT INTO Users (Name, Email, Contact, Gender, Age, Password) VALUES ?', [doctorValues], (err, result) => {
//           if (err) {
//             console.error(err);
//             return res.status(500).json({ message: 'Failed to insert users', error: err });
//           }

//           // Now, get the UserID of each inserted doctor
//           const userIds = result.insertId; // This is where the inserted User IDs are captured
//           const doctorIds = [];
//           for (let i = 0; i < doctorValues.length; i++) {
//             doctorIds.push(userIds + i);  // Assign the UserID to DoctorID (1-to-1 assumption)
//           }

//           // Insert into Doctors table using the UserID as DoctorID
//           const doctorInsertQuery = `INSERT INTO Doctors (UserID, Name, Gender, Age, Department, Cabin, Password) VALUES ?`;
//           const doctorInsertValues = fileRows.map((row, index) => [
//             doctorIds[index],
//             row.Name,
//             row.Gender,
//             row.Age,
//             row.Department,
//             row.Cabin,
//             row.Password
//           ]);

//           db.query(doctorInsertQuery, [doctorInsertValues], (err, result) => {
//             if (err) {
//               console.error(err);
//               return res.status(500).json({ message: 'Failed to insert doctors', error: err });
//             }

//             // Insert specialization if present
//             if (specializationValues.length > 0) {
//               db.query(insertSpecializationQuery, [specializationValues], (err) => {
//                 if (err) {
//                   console.error(err);
//                   return res.status(500).json({ message: 'Failed to insert doctor specializations', error: err });
//                 }

//                 // Insert position if present
//                 if (positionValues.length > 0) {
//                   db.query(insertPositionQuery, [positionValues], (err) => {
//                     if (err) {
//                       console.error(err);
//                       return res.status(500).json({ message: 'Failed to insert doctor positions', error: err });
//                     }

//                     res.status(200).json({ message: 'Doctors imported successfully' });
//                   });
//                 } else {
//                   res.status(200).json({ message: 'Doctors imported successfully (no positions)' });
//                 }
//               });
//             } else {
//               res.status(200).json({ message: 'Doctors imported successfully (no specializations)' });
//             }
//           });
//         });
//       });
//     })
//     .on('error', (err) => {
//       console.error('Error parsing CSV:', err);
//       return res.status(500).json({ message: 'Failed to process CSV file', error: err });
//     });
// };



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
  
    const insertAddUser = `
      INSERT INTO AddUsers (AdminID, UserID, NewAdminID, Experience, Position) 
      VALUES (?, ?, ?, ?, ?)`;
  
    const updateUserRole = `
      UPDATE Users SET Role = 'admin' WHERE UserID = ?`;
  
    db.query(insertAddUser, [adminID, userID, userID, experience, position], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to promote user to admin', error: err });
      }
  
      db.query(updateUserRole, [userID], (err) => {
        if (err) {
          return res.status(500).json({ message: 'User role updated in AddUsers but failed in Users table', error: err });
        }
  
        res.status(201).json({ message: 'Admin user added and role updated successfully' });
      });
    });
  };
  