require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db_mongo');
const { connectPostgres } = require('./config/db_postgres');
require('./models/postgres');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  await connectPostgres();
  // Schema is now owned by migrations (npx sequelize-cli db:migrate),
  // not sync() — this avoids the enum/alter issues we hit before.

  app.listen(PORT, () => {
    console.log(`[server] KrishokBondhon community/Q&A service listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});