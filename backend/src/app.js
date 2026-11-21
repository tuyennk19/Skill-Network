const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const tracksRoutes = require('./routes/tracks.routes');
const coursesRoutes = require('./routes/courses.routes');
const casesRoutes = require('./routes/cases.routes');
const assessmentsRoutes = require('./routes/assessments.routes');
const adminRoutes = require('./routes/admin.routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:']
    }
  }
}));
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/admin', adminRoutes);
app.use(express.static(path.resolve(__dirname, '../../frontend')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
