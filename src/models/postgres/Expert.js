const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db_postgres');
const User = require('./User');

const Expert = sequelize.define('Expert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  institution: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  specialty: {
    type: DataTypes.STRING, // e.g. "Plant Pathology", "Soil Science"
    allowNull: false,
  },
  credentialsDocUrl: {
    type: DataTypes.STRING, // link to uploaded proof of qualification
    allowNull: true,
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // admin flips this after manual review
  },
}, {
  tableName: 'experts',
  timestamps: true,
});

// One user has at most one expert profile
User.hasOne(Expert, { foreignKey: 'userId' });
Expert.belongsTo(User, { foreignKey: 'userId' });

module.exports = Expert;