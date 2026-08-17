const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const communityRoutes = require('./routes/communityRoutes');
const qnaRoutes = require('./routes/qnaRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware must be set up BEFORE any routes are mounted —
// otherwise routes that run first won't have access to what these provide
// (e.g. req.body would be undefined without express.json() running first).
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only relevant when STORAGE_DRIVER=local (the default, for free local
// development). In production with STORAGE_DRIVER=gcs, images are served
// directly from Google Cloud Storage's own URL and this route is unused
// — harmless to leave mounted either way.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Mounted under /v1 to match the Flutter app's ApiConstants.baseUrl,
// which already ends in /v1 (e.g. https://api.krishokbondhon.org/v1).
app.use('/v1/auth', authRoutes);
app.use('/v1/community', communityRoutes);
app.use('/v1/qna', qnaRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;