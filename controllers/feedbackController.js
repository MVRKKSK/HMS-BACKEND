const db = require('../config/db');

// Submit feedback
exports.submitFeedback = (req, res) => {
  const { userID, rating, description } = req.body;

  const feedbackQuery = `INSERT INTO Feedback (Rating, Description) VALUES (?, ?)`;
  db.query(feedbackQuery, [rating, description], (err, feedbackResult) => {
    if (err) return res.status(500).json({ message: 'Failed to submit feedback', error: err });

    const feedbackID = feedbackResult.insertId;
    const giveFeedbackQuery = `INSERT INTO GiveFeedback (FeedbackID, UserID) VALUES (?, ?)`;

    db.query(giveFeedbackQuery, [feedbackID, userID], (err2) => {
      if (err2) return res.status(500).json({ message: 'Failed to link feedback to user', error: err2 });

      res.status(201).json({ message: 'Feedback submitted successfully' });
    });
  });
};

// Get all feedbacks (optional for admin)
exports.getAllFeedbacks = (req, res) => {
  const query = `
    SELECT f.FeedbackID, u.Name AS UserName, f.Rating, f.Description 
    FROM Feedback f
    JOIN GiveFeedback gf ON f.FeedbackID = gf.FeedbackID
    JOIN Users u ON gf.UserID = u.UserID
    ORDER BY f.FeedbackID DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch feedbacks', error: err });
    res.status(200).json(results);
  });
};
