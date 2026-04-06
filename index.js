const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

const { initSchedulers } = require('./utils/scheduler');

dotenv.config();

connectDB();
initSchedulers();

const app = express();


app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/uploads', express.static('uploads')); // accommodate frontend base URIs

app.get('/', (req, res) => {
  res.send('Dream Track API is running...');
});

// Import routes
const userRoutes = require('./routes/userRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const revisionRoutes = require('./routes/revisionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const dppRoutes = require('./routes/dppRoutes');
const pyqRoutes = require('./routes/pyqRoutes');
const plannerRoutes = require('./routes/plannerRoutes');
const quizSessionRoutes = require('./routes/quizSessionRoutes');

const testSeriesRoutes = require('./routes/testSeriesRoutes');
const examRoutes = require('./routes/examRoutes');

const cronRoutes = require('./routes/cronRoutes');

const timerRoutes = require('./routes/timerRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/revisions', revisionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dpp', dppRoutes);
app.use('/api/pyqs', pyqRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/quiz-sessions', quizSessionRoutes);
app.use('/api/test-series', testSeriesRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/schedules', scheduleRoutes);









const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For Vercel
