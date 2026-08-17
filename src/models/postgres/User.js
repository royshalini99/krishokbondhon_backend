const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db_postgres');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[0-9]{10,15}$/,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true },
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  role: {
    type: DataTypes.ENUM('farmer', 'expert', 'admin'),
    defaultValue: 'farmer',
  },
  village: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  district: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  preferredLanguage: {
    type: DataTypes.STRING,
    defaultValue: 'en',
  },
  crops: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;