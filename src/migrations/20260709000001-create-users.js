'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: false, unique: true },
      email: { type: Sequelize.STRING, allowNull: true },
      isEmailVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      role: { type: Sequelize.ENUM('farmer', 'expert', 'admin'), defaultValue: 'farmer' },
      village: { type: Sequelize.STRING, allowNull: true },
      district: { type: Sequelize.STRING, allowNull: true },
      state: { type: Sequelize.STRING, allowNull: true },
      preferredLanguage: { type: Sequelize.STRING, defaultValue: 'en' },
      crops: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      isVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  },
};