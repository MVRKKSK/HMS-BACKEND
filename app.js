const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan'); // ✅ Import morgan
const userRoutes = require('./routes/userRoutes.js');
const doctorRoutes = require('./routes/doctorRoutes');
const prescription = require("./routes/prescriptions")
const admin = require("./routes/admin")
const feedbackRoutes = require('./routes/feedback');
const medicineRoutes = require('./routes/medicine')
// const { errorHandler } = require('./middleware/errorHandler');


const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev')); // ✅ Use morgan middleware
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/prescriptions', prescription);
app.use('/api/admin', admin);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/medicine', medicineRoutes);



// app.use(errorHandler);

module.exports = app;
