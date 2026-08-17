const { Sequelize } = require('sequelize');

/**
 * Opens the connection to PostgreSQL (hosted on Supabase), which stores
 * structured/relational data: user accounts, expert registrations, and
 * OTP verification records. User-generated content (posts, comments,
 * questions, answers) lives in MongoDB, connected separately in db_mongo.js.
 */

if (!process.env.POSTGRES_URI) {
  throw new Error('POSTGRES_URI is not set. Copy .env.example to .env and fill it in.');
}

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,        // Supabase requires SSL connections
      rejectUnauthorized: false, // allows Supabase's SSL cert chain to be trusted
    },
  },
  pool: {
    max: 5,        // max simultaneous connections
    min: 0,
    acquire: 30000, // fail if a connection can't be acquired within 30s
    idle: 10000,    // release idle connections after 10s
  },
});

async function connectPostgres() {
  try {
    await sequelize.authenticate();
    console.log('[postgres] connected:', sequelize.config.database);
  } catch (err) {
    console.error('[postgres] connection error:', err.message);
    throw err; // re-throw so server.js's startup catch can stop the app cleanly
  }
}

module.exports = { sequelize, connectPostgres };