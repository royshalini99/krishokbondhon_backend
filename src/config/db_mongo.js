const mongoose = require('mongoose');

/**
 * Opens the connection to MongoDB, which stores all user-generated content
 * for this service: posts, comments, questions, answers. Structured data
 * (user credentials, expert registrations) lives in PostgreSQL, managed by
 * a separate service — this backend doesn't touch that database at all.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and fill it in.');
  }

  mongoose.connection.on('connected', () => {
    console.log('[mongo] connected:', mongoose.connection.name);
  });
  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
  });

  await mongoose.connect(uri);
}

module.exports = { connectDB };
