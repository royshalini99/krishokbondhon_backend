const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db_postgres');

const EmailVerification = sequelize.define('EmailVerification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  otpCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'email_verifications',
  timestamps: true,
});

module.exports = EmailVerification;