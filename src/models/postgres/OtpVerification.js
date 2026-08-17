const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db_postgres');

const OtpVerification = sequelize.define('OtpVerification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  phone: {
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
    defaultValue: false, // prevents reusing the same OTP twice
  },
}, {
  tableName: 'otp_verifications',
  timestamps: true,
});

module.exports = OtpVerification;