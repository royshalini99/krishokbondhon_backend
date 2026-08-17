require('dotenv').config();

const sslConfig = {
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
};

module.exports = {
  development: {
    use_env_variable: 'POSTGRES_URI',
    dialect: 'postgres',
    ...sslConfig,
  },
  test: {
    use_env_variable: 'POSTGRES_URI',
    dialect: 'postgres',
    ...sslConfig,
  },
  production: {
    use_env_variable: 'POSTGRES_URI',
    dialect: 'postgres',
    ...sslConfig,
  },
};